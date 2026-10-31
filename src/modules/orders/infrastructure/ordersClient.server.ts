import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import { isOrderNumber, ORDERS_PER_PAGE, type Order, type OrderPage } from "../domain/Order";
import { toOrder, toOrderSummary } from "./orderMapper";
import { isListedWooStatus } from "./statusMapper";
import type { StoreProductRef, WcOrder, WcOrderListItem } from "./wcOrderDto";

// Orders are read with the server keys (customers cannot read wc/v3), so the
// caller must pass a customer id WordPress verified (verifiedCaller in app/api).
// Woo's `customer=0` means guest orders: never let an empty or zero id through.
const requireCustomer = (customerId: string) => {
  if (!/^[1-9]\d*$/.test(customerId)) throw new AppError("unauthenticated", "Sign in to see your orders", 401);
};

const notFound = () => new AppError("not_found", "Not found", 404);

const intHeader = (headers: Headers, name: string, fallback: number) => {
  const n = Number.parseInt(headers.get(name) ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** One page of the customer's orders, newest first. */
export async function listOrders(customerId: string, page: number): Promise<OrderPage> {
  requireCustomer(customerId);
  const res = await wooFetch<WcOrderListItem[]>({
    path: "/wc/v3/orders",
    auth: "keys",
    query: {
      customer: customerId,
      page,
      per_page: ORDERS_PER_PAGE,
      orderby: "date",
      order: "desc",
      _fields: "id,status,currency,date_created,total,line_items",
    },
  });
  return {
    orders: res.data.filter((o) => isListedWooStatus(o.status)).map(toOrderSummary),
    page,
    totalPages: Math.max(1, intHeader(res.headers, "x-wp-totalpages", 1)),
    total: intHeader(res.headers, "x-wp-total", res.data.length),
  };
}

/** Product slugs for the order's links; a missing or failing lookup only drops links. */
async function slugsOf(productIds: number[]): Promise<Record<string, string>> {
  const ids = productIds.filter((id, i) => id > 0 && productIds.indexOf(id) === i);
  if (!ids.length) return {};
  try {
    const { data } = await wooFetch<StoreProductRef[]>({
      path: "/wc/store/v1/products",
      query: { include: ids.join(","), per_page: ids.length, _fields: "id,slug" },
      next: { revalidate: 300, tags: ["catalog"] },
    });
    return Object.fromEntries(data.map((p) => [String(p.id), p.slug]));
  } catch {
    return {};
  }
}

/** One of the customer's orders; anyone else's, or a hidden one, is "not found". */
export async function getOrder(orderId: string, customerId: string): Promise<Order> {
  requireCustomer(customerId);
  if (!isOrderNumber(orderId)) throw notFound();
  const { data } = await wooFetch<WcOrder>({
    path: `/wc/v3/orders/${orderId}`,
    auth: "keys",
    // Woo answers 404 for an unknown id and 400 for some malformed ones.
    mapError: (status) => (status === 404 || status === 400 ? notFound() : undefined),
  });
  if (String(data.customer_id) !== customerId || !isListedWooStatus(data.status)) throw notFound();
  return toOrder(data, await slugsOf(data.line_items.map((l) => l.product_id)));
}
