// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as listRoute from "./route";
import * as orderRoute from "./[id]/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (id: number) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp: Math.floor(Date.now() / 1000) + 3600, data: { user: { id } } })}.sig`;
const respond = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });
const me = (id: number) => respond({ id, name: "Mona", email: "m@x.io", first_name: "Mona", last_name: "Ali" });
const isMe = (url: unknown) => String(url).includes("/wp/v2/users/me");
const addr = { first_name: "Mona", last_name: "Ali", address_1: "5 Tahrir St", address_2: "", city: "Dokki", state: "EGGZ", postcode: "12611", phone: "01012345678" };
const order = (customer: number) => ({
  id: 300, status: "processing", customer_id: customer, currency: "EGP", date_created: "2026-10-31T10:00:00", date_completed: null,
  payment_method: "cod", customer_note: "", total: "100.00", shipping_total: "0", discount_total: "0", shipping: addr, billing: addr, line_items: [],
});
const get = (path: string, cookie: string) => new NextRequest(new URL(path, "http://localhost"), { headers: { cookie } });
const keyCalls = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls.filter(([u]) => !isMe(u));

describe("orders routes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
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

  it("lists the verified customer's orders, private and uncached", async () => {
    fetchMock.mockImplementation(async (url: string) => (isMe(url) ? me(9) : respond([order(9)], 200, { "X-WP-Total": "1", "X-WP-TotalPages": "1" })));
    const res = await listRoute.GET(get("/api/shop/orders?page=1", `credentials=${jwt(9)}`), {});
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect((await res.json()).orders).toMatchObject({ page: 1, total: 1, orders: [{ id: "300", status: "placed" }] });
    expect(new URL(String(keyCalls(fetchMock)[0][0])).searchParams.get("customer")).toBe("9");
  });

  it("clamps the page number", async () => {
    fetchMock.mockImplementation(async (url: string) => (isMe(url) ? me(9) : respond([], 200, { "X-WP-Total": "0", "X-WP-TotalPages": "0" })));
    for (const [q, expected] of [["page=-4", "1"], ["page=abc", "1"], ["page=999999", "1000"]]) {
      fetchMock.mockClear();
      await listRoute.GET(get(`/api/shop/orders?${q}`, `credentials=${jwt(9)}`), {});
      expect(new URL(String(keyCalls(fetchMock)[0][0])).searchParams.get("page")).toBe(expected);
    }
  });

  it("serves only the customer's own order", async () => {
    fetchMock.mockImplementation(async (url: string) => (isMe(url) ? me(9) : String(url).includes("/products") ? respond([]) : respond(order(10))));
    const res = await orderRoute.GET(get("/api/shop/orders/300", `credentials=${jwt(9)}`), { params: { id: "300" } });
    expect(res.status).toBe(404);
    const bad = await orderRoute.GET(get("/api/shop/orders/abc", `credentials=${jwt(9)}`), { params: { id: "abc" } });
    expect(bad.status).toBe(404);
  });

  it("needs a session", async () => {
    expect((await listRoute.GET(get("/api/shop/orders", ""), {})).status).toBe(401);
    expect((await orderRoute.GET(get("/api/shop/orders/300", ""), { params: { id: "300" } })).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // The cookie's claims are only decoded: a hand-made token naming customer 10
  // must not read customer 10's orders with the server keys.
  it("refuses a forged session before any read with the server keys", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      isMe(url) ? respond({ code: "jwt_auth_invalid_token", message: "Signature verification failed" }, 403) : respond(order(10))
    );
    const forged = `credentials=${jwt(10)}`;
    expect((await orderRoute.GET(get("/api/shop/orders/300", forged), { params: { id: "300" } })).status).toBe(401);
    expect((await listRoute.GET(get("/api/shop/orders", forged), {})).status).toBe(401);
    expect(keyCalls(fetchMock)).toHaveLength(0);
  });

  it("refuses a valid token whose claims name someone else", async () => {
    fetchMock.mockImplementation(async (url: string) => (isMe(url) ? me(9) : respond(order(10))));
    const res = await orderRoute.GET(get("/api/shop/orders/300", `credentials=${jwt(10)}`), { params: { id: "300" } });
    expect(res.status).toBe(401);
    expect(keyCalls(fetchMock)).toHaveLength(0);
  });
});
