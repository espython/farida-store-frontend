// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetCheckoutGuard } from "@/modules/checkout/infrastructure/checkoutGuard.server";
import * as orderRoute from "./order/route";
import * as addressRoute from "./address/route";
import * as couponRoute from "./coupon/route";
import * as ordersRoute from "../orders/[id]/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (id: number) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp: Math.floor(Date.now() / 1000) + 3600, data: { user: { id } } })}.sig`;
const cookie = `credentials=${jwt(9)}; cart_token=9.tok`;
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "cart-token": "tok" } });
const addr = { first_name: "Mona", last_name: "Ali", address_1: "12 El Nasr St", address_2: "", city: "Nasr City", state: "EGC", postcode: "", country: "EG", phone: "01001234567" };
const storeCart = {
  items: [{ key: "k1", id: 1, quantity: 1, name: "K", permalink: "https://s/product/k/", prices: { price: "100", regular_price: "100", sale_price: "100", currency_code: "EGP", currency_minor_unit: 2 }, quantity_limits: { minimum: 1, maximum: 9, multiple_of: 1, editable: true } }],
  shipping_address: addr,
  billing_address: { ...addr, email: "m@x.io" },
  shipping_rates: [],
  coupons: [],
  payment_methods: ["cod"],
  totals: { total_items: "100", total_shipping: "0", total_discount: "0", total_price: "100", currency_code: "EGP", currency_minor_unit: 2 },
};
// WordPress resolves the token to this user (verifiedCaller).
const me = (id = 9) => respond({ id, name: "Mona", email: "m@x.io", first_name: "Mona", last_name: "Ali" });
const isMe = (url: unknown) => String(url).includes("/wp/v2/users/me");
const post = (path: string, body: unknown, headers: Record<string, string> = {}, method = "POST") =>
  new NextRequest(new URL(path, "http://localhost"), { method, headers: { cookie, ...headers }, body: JSON.stringify(body) });

describe("checkout routes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    resetCheckoutGuard();
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

  it("requires an idempotency key and refuses card (#326) before calling WordPress", async () => {
    expect((await orderRoute.POST(post("/api/shop/checkout/order", { paymentMethod: "cod" }), {})).status).toBe(400);
    const card = await orderRoute.POST(post("/api/shop/checkout/order", { paymentMethod: "card" }, { "Idempotency-Key": "9_abcdef12" }), {});
    expect((await card.json()).error.code).toBe("payment_unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("places one order for a double submit with the same key", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      isMe(url) ? me() : url.endsWith("/checkout") ? respond({ order_id: 300, status: "processing", order_key: "k", payment_method: "cod" }) : respond(storeCart)
    );
    const send = () => orderRoute.POST(post("/api/shop/checkout/order", { paymentMethod: "cod", note: "hi" }, { "Idempotency-Key": "9_abcdef12" }), {});
    const [a, b] = await Promise.all([send(), send()]);
    expect([(await a.json()).orderId, (await b.json()).orderId]).toEqual(["300", "300"]);
    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith("/checkout"))).toHaveLength(1);
  });

  it("validates the address with the domain rules before calling Woo", async () => {
    const res = await addressRoute.PUT(
      post("/api/shop/checkout/address", { address: { firstName: "", lastName: "Ali", address1: "x", address2: "", city: "c", state: "XX", postcode: "", phone: "123" } }, {}, "PUT"),
      {}
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatchObject({ code: "invalid_address", details: { firstName: "required", state: "governorate_invalid", phone: "phone_invalid" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed coupon codes without calling Woo", async () => {
    const res = await couponRoute.POST(post("/api/shop/checkout/coupon", { code: "no spaces!" }), {});
    expect((await res.json()).error.code).toBe("coupon_invalid");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serves only the customer's own order", async () => {
    const order = { id: 300, status: "processing", customer_id: 10, date_created: "2026-10-31", payment_method: "cod", customer_note: "", total: "1.00", shipping_total: "0", discount_total: "0", currency: "EGP", shipping: addr, billing: addr, line_items: [] };
    fetchMock.mockImplementation(async (url: string) => (isMe(url) ? me() : respond(order)));
    const get = (id: string) => ordersRoute.GET(new NextRequest(new URL(`/api/shop/orders/${id}`, "http://localhost"), { headers: { cookie } }), { params: { id } });
    expect((await get("300")).status).toBe(404);
    expect((await get("abc")).status).toBe(404);
  });

  // The cookie's claims are only decoded: a hand-made token naming customer 10
  // must not read customer 10's order with the server keys, nor place orders.
  it("refuses a forged session before any read with the server keys", async () => {
    const forged = `credentials=${jwt(10)}`;
    const order = { id: 300, status: "processing", customer_id: 10, date_created: "2026-10-31", payment_method: "cod", customer_note: "", total: "1.00", shipping_total: "0", discount_total: "0", currency: "EGP", shipping: addr, billing: addr, line_items: [] };
    fetchMock.mockImplementation(async (url: string) =>
      isMe(url) ? respond({ code: "jwt_auth_invalid_token", message: "Signature verification failed" }, 403) : respond(order)
    );
    const read = await ordersRoute.GET(new NextRequest(new URL("/api/shop/orders/300", "http://localhost"), { headers: { cookie: forged } }), { params: { id: "300" } });
    expect(read.status).toBe(401);
    const place = await orderRoute.POST(
      new NextRequest(new URL("/api/shop/checkout/order", "http://localhost"), { method: "POST", headers: { cookie: forged, "Idempotency-Key": "10_abcdef12" }, body: JSON.stringify({ paymentMethod: "cod" }) }),
      {}
    );
    expect(place.status).toBe(401);
    expect(fetchMock.mock.calls.every(([u]) => isMe(u))).toBe(true);
  });

  it("refuses a valid token whose claims name someone else", async () => {
    fetchMock.mockImplementation(async (url: string) => (isMe(url) ? me(9) : respond({})));
    const res = await ordersRoute.GET(new NextRequest(new URL("/api/shop/orders/300", "http://localhost"), { headers: { cookie: `credentials=${jwt(10)}` } }), { params: { id: "300" } });
    expect(res.status).toBe(401);
    expect(fetchMock.mock.calls.every(([u]) => isMe(u))).toBe(true);
  });
});
