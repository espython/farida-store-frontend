// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/kernel/Money";
import { applyCoupon, placeOrder, selectShippingRate, setAddress } from "./checkoutClient.server";
import { placeOnce, resetCheckoutGuard } from "./checkoutGuard.server";
import { toCheckout } from "./checkoutMapper";
import type { StoreCheckoutCart } from "./storeCheckoutDto";

const address = { first_name: "Mona", last_name: "Ali", address_1: "12 El Nasr St", address_2: "", city: "Nasr City", state: "EGC", postcode: "", country: "EG", phone: "01001234567" };
const cart = (over: Partial<StoreCheckoutCart> = {}): StoreCheckoutCart => ({
  items: [
    {
      key: "k1",
      id: 1,
      quantity: 2,
      name: "Kettle",
      permalink: "https://shop.test/product/kettle/",
      prices: { price: "50000", regular_price: "50000", sale_price: "50000", currency_code: "EGP", currency_minor_unit: 2 },
      quantity_limits: { minimum: 1, maximum: 9, multiple_of: 1, editable: true },
    },
  ],
  shipping_address: address,
  billing_address: { ...address, email: "m@x.io" },
  shipping_rates: [{ package_id: 0, shipping_rates: [{ rate_id: "flat_rate:1", name: "Flat rate", price: "5000", currency_minor_unit: 2, selected: true }] }],
  coupons: [{ code: "save10", totals: { total_discount: "10000", currency_minor_unit: 2 } }],
  payment_methods: ["cod", "bacs"],
  totals: { total_items: "100000", total_shipping: "5000", total_discount: "10000", total_price: "95000", currency_code: "EGP", currency_minor_unit: 2 },
  ...over,
});

describe("checkout mapper", () => {
  it("maps the Store API cart to a checkout with Woo's totals", () => {
    const c = toCheckout(cart(), []);
    expect(c.address).toMatchObject({ firstName: "Mona", state: "EGC", phone: "01001234567" });
    expect(c.shippingRates).toEqual([{ id: "flat_rate:1", name: "Flat rate", price: Money.of(5000), selected: true }]);
    expect(c.coupons).toEqual([{ code: "save10", discount: Money.of(10000) }]);
    // Gateways we don't support are not offered.
    expect(c.paymentMethods).toEqual(["cod"]);
    expect(c.totals).toEqual({ items: Money.of(100000), shipping: Money.of(5000), discount: Money.of(10000), total: Money.of(95000) });
  });

  it("falls back to the billing address and its phone", () => {
    const c = toCheckout(cart({ shipping_address: { ...address, address_1: "", phone: "" } }), []);
    expect(c.address.address1).toBe("12 El Nasr St");
    expect(c.address.phone).toBe("01001234567");
  });

});

describe("checkout client", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "cart-token": "tok" } });
  const sent = (i: number) => {
    const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit & { headers: Record<string, string> }];
    return { path: new URL(url).pathname.replace("/wp-json", ""), init, body: init.body ? JSON.parse(init.body as string) : undefined };
  };
  const caller = { jwt: "jwt", cartToken: "tok" };

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

  it("saves the address for shipping and billing, keeping the account email", async () => {
    fetchMock.mockResolvedValueOnce(respond(cart())).mockResolvedValueOnce(respond(cart()));
    await setAddress(caller, { firstName: "Mona", lastName: "Ali", address1: "1 St", address2: "", city: "Giza", state: "EGGZ", postcode: "12611", phone: "01001234567" });
    const { path, body } = sent(1);
    expect(path).toBe("/wc/store/v1/cart/update-customer");
    expect(body.shipping_address).toMatchObject({ state: "EGGZ", country: "EG", address_1: "1 St" });
    expect(body.billing_address).toMatchObject({ state: "EGGZ", email: "m@x.io" });
  });

  it("selects a rate in its package and refuses unknown rates", async () => {
    fetchMock.mockResolvedValueOnce(respond(cart())).mockResolvedValueOnce(respond(cart()));
    await selectShippingRate(caller, "flat_rate:1");
    expect(sent(1).body).toEqual({ package_id: 0, rate_id: "flat_rate:1" });
    fetchMock.mockResolvedValueOnce(respond(cart()));
    await expect(selectShippingRate(caller, "nope")).rejects.toMatchObject({ status: 400 });
  });

  it("turns Woo's coupon error into coupon_invalid", async () => {
    fetchMock.mockResolvedValueOnce(respond(cart())).mockResolvedValueOnce(respond({ code: "woocommerce_rest_cart_coupon_error", message: "x" }, 400));
    await expect(applyCoupon(caller, "nope")).rejects.toMatchObject({ code: "coupon_invalid", status: 400 });
  });

  it("places a COD order with the saved addresses and the note; refuses an empty cart", async () => {
    fetchMock.mockResolvedValueOnce(respond(cart())).mockResolvedValueOnce(respond({ order_id: 290, status: "processing", order_key: "wc_order_x", payment_method: "cod" }));
    const r = await placeOrder(caller, { paymentMethod: "cod", note: "Call me" });
    expect(r).toMatchObject({ orderId: "290", status: "processing" });
    expect(sent(1)).toMatchObject({ path: "/wc/store/v1/checkout", body: { payment_method: "cod", customer_note: "Call me", shipping_address: { state: "EGC" } } });

    fetchMock.mockResolvedValueOnce(respond(cart({ items: [] })));
    await expect(placeOrder(caller, { paymentMethod: "cod", note: "" })).rejects.toMatchObject({ code: "cart_empty", status: 409 });
  });

  it("maps Woo's address check at checkout to invalid_address", async () => {
    fetchMock.mockResolvedValueOnce(respond(cart())).mockResolvedValueOnce(respond({ code: "woocommerce_rest_invalid_address", message: "Postcode / ZIP is required" }, 400));
    await expect(placeOrder(caller, { paymentMethod: "cod", note: "" })).rejects.toMatchObject({ code: "invalid_address", status: 400 });
  });

  it("passes Woo's stock code through when an item ran out", async () => {
    fetchMock.mockResolvedValueOnce(respond(cart())).mockResolvedValueOnce(respond({ code: "woocommerce_rest_product_out_of_stock", message: "x" }, 409));
    await expect(placeOrder(caller, { paymentMethod: "cod", note: "" })).rejects.toMatchObject({ code: "woocommerce_rest_product_out_of_stock" });
  });
});

describe("placeOnce", () => {
  beforeEach(() => resetCheckoutGuard());

  it("runs concurrent calls with the same key once and shares the result", async () => {
    let calls = 0;
    const place = () => new Promise<string>((r) => setTimeout(() => r(`order-${++calls}`), 10));
    const [a, b, c] = await Promise.all([placeOnce("7", "key-1", place), placeOnce("7", "key-1", place), placeOnce("7", "key-1", place)]);
    expect([a, b, c]).toEqual(["order-1", "order-1", "order-1"]);
    expect(calls).toBe(1);
  });

  it("serializes different keys of one customer, and does not remember failures", async () => {
    const order: string[] = [];
    const slow = (name: string, ms: number) => () => new Promise<string>((r) => setTimeout(() => (order.push(name), r(name)), ms));
    await Promise.all([placeOnce("7", "a", slow("a", 20)), placeOnce("7", "b", slow("b", 1))]);
    expect(order).toEqual(["a", "b"]);

    await expect(placeOnce("7", "c", () => Promise.reject(new Error("down")))).rejects.toThrow("down");
    expect(await placeOnce("7", "c", async () => "retried")).toBe("retried");
  });

  it("forgets a result after the replay window", async () => {
    let t = 0;
    const now = () => t;
    expect(await placeOnce("7", "k", async () => "first", now)).toBe("first");
    t = 11 * 60 * 1000;
    expect(await placeOnce("7", "k", async () => "second", now)).toBe("second");
  });
});
