// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/kernel/Money";
import { isOrderNumber, parseOrderNumber, trackingOf } from "./domain/Order";
import { toOrder, toOrderSummary } from "./infrastructure/orderMapper";
import { isListedWooStatus, toOrderPayment, toOrderStatus } from "./infrastructure/statusMapper";
import { getOrder, listOrders } from "./infrastructure/ordersClient.server";
import type { WcOrder } from "./infrastructure/wcOrderDto";

const address = { first_name: "Mona", last_name: "Ali", address_1: "5 Tahrir St", address_2: "", city: "Dokki", state: "EGGZ", postcode: "12611", phone: "" };
const wcOrder = (over: Partial<WcOrder> = {}): WcOrder => ({
  id: 298,
  status: "processing",
  customer_id: 7,
  currency: "EGP",
  date_created: "2026-10-31T17:30:42",
  date_completed: null,
  payment_method: "cod",
  customer_note: "Call first",
  total: "5774.00",
  shipping_total: "50.00",
  discount_total: "636.00",
  shipping: address,
  billing: { ...address, phone: "01012345678" },
  line_items: [
    { product_id: 240, name: "Retro Kettle", quantity: 2, subtotal: "3980.00", total: "3582.00", image: { src: "https://shop.test/k.jpg" } },
    { product_id: 241, name: "Nova Kettle", quantity: 2, subtotal: "2380.00", total: "2142.00", image: null },
  ],
  ...over,
});

describe("order domain", () => {
  it("tracks an order through placed → out for delivery → delivered", () => {
    expect(trackingOf("placed")?.map((s) => s.state)).toEqual(["current", "upcoming", "upcoming"]);
    expect(trackingOf("out_for_delivery")?.map((s) => s.state)).toEqual(["done", "current", "upcoming"]);
    expect(trackingOf("delivered")?.map((s) => s.state)).toEqual(["done", "done", "done"]);
  });

  it("has no timeline for orders that left the delivery flow", () => {
    for (const s of ["cancelled", "refunded", "failed", "awaiting_payment"] as const) expect(trackingOf(s)).toBeNull();
  });

  it("reads order numbers the way customers type them", () => {
    expect(parseOrderNumber(" #298 ")).toBe("298");
    expect(parseOrderNumber("# 298")).toBe("298");
    for (const bad of ["", "0", "abc", "29 8", "-1", "1".repeat(13), "../1"]) expect(parseOrderNumber(bad)).toBeNull();
    expect(isOrderNumber("0")).toBe(false);
  });
});

describe("order mapping", () => {
  it("maps Woo statuses, including the shop's out-for-delivery, and hides drafts", () => {
    expect(["pending", "processing", "on-hold", "out-for-delivery", "completed", "cancelled", "refunded", "failed"].map(toOrderStatus)).toEqual([
      "awaiting_payment",
      "placed",
      "placed",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "refunded",
      "failed",
    ]);
    expect(toOrderStatus("some-new-status")).toBe("placed");
    expect(isListedWooStatus("checkout-draft")).toBe(false);
    expect(isListedWooStatus("processing")).toBe(true);
    expect([toOrderPayment("cod"), toOrderPayment("paymob"), toOrderPayment("bacs")]).toEqual(["cod", "card", "other"]);
  });

  it("maps a whole order: lines before coupons add up to items, phone from billing", () => {
    const o = toOrder(wcOrder(), { "240": "retro-kettle" });
    expect(o).toMatchObject({
      id: "298",
      status: "placed",
      payment: "cod",
      itemCount: 4,
      note: "Call first",
      deliveredAt: null,
      address: { firstName: "Mona", state: "EGGZ", phone: "01012345678" },
      totals: { items: Money.of(636000), shipping: Money.of(5000), discount: Money.of(63600), total: Money.of(577400) },
    });
    expect(o.lines.map((l) => [l.slug, l.total.amount, l.image])).toEqual([
      ["retro-kettle", 398000, "https://shop.test/k.jpg"],
      [null, 238000, null],
    ]);
    expect(Money.add(o.lines[0].total, o.lines[1].total)).toEqual(o.totals.items);
  });

  it("refuses another currency rather than showing wrong amounts", () => {
    expect(() => toOrderSummary(wcOrder({ currency: "USD" }))).toThrow();
  });
});

describe("orders client", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const respond = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });
  const sent = (i: number) => {
    const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit & { headers: Record<string, string> }];
    const u = new URL(url);
    return { path: u.pathname.replace("/wp-json", ""), params: u.searchParams, init };
  };

  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    process.env.WC_CONSUMER_KEY = "ck";
    process.env.WC_CONSUMER_SECRET = "cs";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("lists only this customer's orders, newest first, with Woo's page counts", async () => {
    fetchMock.mockResolvedValueOnce(respond([wcOrder(), wcOrder({ id: 297, status: "completed" })], 200, { "X-WP-Total": "12", "X-WP-TotalPages": "2" }));
    const page = await listOrders("7", 2);
    const { path, params, init } = sent(0);
    expect(path).toBe("/wc/v3/orders");
    expect(Object.fromEntries(params)).toMatchObject({ customer: "7", page: "2", per_page: "10", orderby: "date", order: "desc" });
    expect(init.headers.Authorization).toMatch(/^Basic /);
    expect(page).toMatchObject({ page: 2, totalPages: 2, total: 12 });
    expect(page.orders.map((o) => [o.id, o.status, o.itemCount])).toEqual([
      ["298", "placed", 4],
      ["297", "delivered", 4],
    ]);
  });

  // customer=0 is Woo's filter for guest orders.
  it("never asks Woo for orders without a real customer id", async () => {
    for (const id of ["0", "", "07x", "-1"]) {
      await expect(listOrders(id, 1)).rejects.toMatchObject({ status: 401 });
      await expect(getOrder("298", id)).rejects.toMatchObject({ status: 401 });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads one order with product links, and only the customer's own", async () => {
    fetchMock.mockResolvedValueOnce(respond(wcOrder())).mockResolvedValueOnce(respond([{ id: 240, slug: "retro-kettle" }]));
    const order = await getOrder("298", "7");
    expect(order.lines[0].slug).toBe("retro-kettle");
    expect(sent(1).path).toBe("/wc/store/v1/products");
    expect(sent(1).params.get("include")).toBe("240,241");

    fetchMock.mockResolvedValueOnce(respond(wcOrder()));
    await expect(getOrder("298", "8")).rejects.toMatchObject({ status: 404 });
  });

  it("treats unknown, malformed and draft orders as not found", async () => {
    fetchMock.mockResolvedValueOnce(respond({ code: "woocommerce_rest_shop_order_invalid_id", message: "Invalid ID." }, 404));
    await expect(getOrder("99999", "7")).rejects.toMatchObject({ status: 404 });
    fetchMock.mockResolvedValueOnce(respond(wcOrder({ status: "checkout-draft" })));
    await expect(getOrder("298", "7")).rejects.toMatchObject({ status: 404 });
    await expect(getOrder("abc", "7")).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("still shows the order when the product lookup fails (no links)", async () => {
    fetchMock.mockResolvedValueOnce(respond(wcOrder())).mockRejectedValueOnce(new Error("down"));
    const order = await getOrder("298", "7");
    expect(order.lines.map((l) => l.slug)).toEqual([null, null]);
  });
});
