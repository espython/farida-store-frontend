import { AppError } from "@/shared/kernel/AppError";
import { Money } from "@/shared/kernel/Money";
import type { DeliveryAddress, Order, OrderSummary } from "../domain/Order";
import { toOrderPayment, toOrderStatus } from "./statusMapper";
import type { WcAddress, WcOrder, WcOrderListItem } from "./wcOrderDto";

const dec = (v: string | null | undefined) => Money.fromDecimal(v || "0");

const egp = (o: { currency: string }) => {
  if (o.currency !== "EGP") throw new AppError("invalid_money", "Unsupported currency", 502);
};

const toAddress = (a: Partial<WcAddress> | undefined): DeliveryAddress => ({
  firstName: a?.first_name ?? "",
  lastName: a?.last_name ?? "",
  address1: a?.address_1 ?? "",
  address2: a?.address_2 ?? "",
  city: a?.city ?? "",
  state: a?.state ?? "",
  postcode: a?.postcode ?? "",
  phone: a?.phone ?? "",
});

const countItems = (o: Pick<WcOrder, "line_items">) => (o.line_items ?? []).reduce((n, l) => n + l.quantity, 0);

export const toOrderSummary = (o: WcOrderListItem): OrderSummary => {
  egp(o);
  return {
    id: String(o.id),
    status: toOrderStatus(o.status),
    createdAt: o.date_created,
    itemCount: countItems(o),
    total: dec(o.total),
  };
};

/** REST order → Order; `slugs` maps product ids to slugs for the product links. */
export const toOrder = (o: WcOrder, slugs: Record<string, string> = {}): Order => {
  egp(o);
  // Shipping address; the phone is kept on billing by Woo when shipping has none.
  const address = toAddress(o.shipping);
  if (!address.phone) address.phone = o.billing?.phone ?? "";
  const total = dec(o.total);
  const shipping = dec(o.shipping_total);
  const discount = dec(o.discount_total);
  return {
    ...toOrderSummary(o),
    payment: toOrderPayment(o.payment_method),
    deliveredAt: o.date_completed || null,
    lines: o.line_items.map((l) => ({
      productId: String(l.product_id),
      title: l.name,
      quantity: l.quantity,
      total: dec(l.subtotal ?? l.total),
      image: l.image?.src || null,
      slug: slugs[String(l.product_id)] ?? null,
    })),
    address,
    note: o.customer_note ?? "",
    // Items before coupons: what was paid plus the discount, minus shipping.
    totals: { items: Money.subtract(Money.add(total, discount), shipping), shipping, discount, total },
  };
};
