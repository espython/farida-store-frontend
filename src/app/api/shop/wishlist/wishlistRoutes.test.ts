// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as listRoute from "./route";
import * as itemRoute from "./items/[productId]/route";
import * as mergeRoute from "./merge/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (id: number) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp: Math.floor(Date.now() / 1000) + 3600, data: { user: { id } } })}.sig`;
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const isMe = (url: unknown) => String(url).includes("/wp/v2/users/me");
const PRODUCTS = new Set(["11", "12", "13"]);

type Customer = { id: number; meta_data: { key: string; value: unknown }[] };

/** wc/v3/customers GET/PUT (meta replaced by key), Store API product lookup, users/me as `session`. */
const fakeWoo = (customers: Record<number, Customer>, session: { id: number } | "forged") =>
  vi.fn(async (url: string, init?: RequestInit) => {
    if (isMe(url)) {
      return session === "forged" ? respond({ code: "jwt_auth_invalid_token" }, 403) : respond({ id: session.id, name: "c_x", email: "m@x.io" });
    }
    const product = /\/wc\/store\/v1\/products\/(\d+)/.exec(url)?.[1];
    if (product) return PRODUCTS.has(product) ? respond({ id: Number(product) }) : respond({ code: "woocommerce_rest_product_invalid_id" }, 404);
    const c = customers[Number(/\/wc\/v3\/customers\/(\d+)/.exec(url)?.[1])];
    if (!c) return respond({ code: "woocommerce_rest_invalid_id" }, 404);
    if (init?.method === "PUT") {
      for (const m of JSON.parse(String(init.body)).meta_data ?? []) c.meta_data = [...c.meta_data.filter((x) => x.key !== m.key), m];
    }
    return respond(c);
  });

const req = (cookie: string, method = "GET", body?: unknown) =>
  new NextRequest(new URL("/api/shop/wishlist", "http://localhost"), {
    method,
    headers: { cookie, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
const as = (id: number) => `credentials=${jwt(id)}`;
const item = (id: string) => ({ params: { productId: id } });
const keyCalls = (f: ReturnType<typeof vi.fn>) => f.mock.calls.filter(([u]) => String(u).includes("/wc/v3/"));
const stored = (c: Customer) => JSON.parse(String(c.meta_data.find((m) => m.key === "farida_wishlist")?.value ?? "{}")).ids;

describe("wishlist routes", () => {
  let customers: Record<number, Customer>;
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    process.env.WC_CONSUMER_KEY = "ck";
    process.env.WC_CONSUMER_SECRET = "cs";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    customers = { 9: { id: 9, meta_data: [{ key: "farida_address_book", value: "{}" }] }, 10: { id: 10, meta_data: [] } };
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("saves, lists and removes products on the verified customer, private and uncached", async () => {
    vi.stubGlobal("fetch", fakeWoo(customers, { id: 9 }));
    const empty = await listRoute.GET(req(as(9)), {});
    expect(empty.headers.get("cache-control")).toBe("private, no-store");
    expect((await empty.json()).wishlist).toEqual({ productIds: [] });

    await itemRoute.PUT(req(as(9), "PUT"), item("11"));
    const two = await (await itemRoute.PUT(req(as(9), "PUT"), item("12"))).json();
    expect(two.wishlist.productIds).toEqual(["12", "11"]);
    // Saving again changes nothing.
    expect((await (await itemRoute.PUT(req(as(9), "PUT"), item("11"))).json()).wishlist.productIds).toEqual(["12", "11"]);
    expect(stored(customers[9])).toEqual(["12", "11"]);
    // Other meta (the address book) is left alone.
    expect(customers[9].meta_data.find((m) => m.key === "farida_address_book")?.value).toBe("{}");

    const removed = await (await itemRoute.DELETE(req(as(9), "DELETE"), item("12"))).json();
    expect(removed.wishlist.productIds).toEqual(["11"]);
  });

  it("refuses products the shop does not sell, and bad ids before any call", async () => {
    const f = fakeWoo(customers, { id: 9 });
    vi.stubGlobal("fetch", f);
    expect((await itemRoute.PUT(req(as(9), "PUT"), item("404"))).status).toBe(404);
    expect(customers[9].meta_data.some((m) => m.key === "farida_wishlist")).toBe(false);
    f.mockClear();
    expect((await itemRoute.PUT(req(as(9), "PUT"), item("../10"))).status).toBe(404);
    expect(f).not.toHaveBeenCalled();
  });

  it("refuses a product past the limit", async () => {
    customers[9].meta_data.push({ key: "farida_wishlist", value: JSON.stringify({ v: 1, ids: Array.from({ length: 50 }, (_, i) => String(100 + i)) }) });
    vi.stubGlobal("fetch", fakeWoo(customers, { id: 9 }));
    const res = await itemRoute.PUT(req(as(9), "PUT"), item("11"));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("wishlist_full");
  });

  it("merges a guest list after sign-in and reports what did not fit", async () => {
    customers[9].meta_data.push({ key: "farida_wishlist", value: JSON.stringify({ v: 1, ids: ["11"] }) });
    vi.stubGlobal("fetch", fakeWoo(customers, { id: 9 }));
    const res = await (await mergeRoute.POST(req(as(9), "POST", { productIds: ["13", "11"] }), {})).json();
    expect(res).toEqual({ wishlist: { productIds: ["13", "11"] }, skipped: 0 });
    expect((await mergeRoute.POST(req(as(9), "POST", { productIds: ["1/2"] }), {})).status).toBe(400);
  });

  it("only ever reads and writes the verified customer", async () => {
    const f = fakeWoo(customers, { id: 9 });
    vi.stubGlobal("fetch", f);
    await itemRoute.PUT(req(as(9), "PUT"), item("11"));
    expect(keyCalls(f).every(([u]) => String(u).includes("/wc/v3/customers/9"))).toBe(true);
    expect(customers[10].meta_data).toEqual([]);
  });

  it("refuses a forged session, or claims naming someone else, before any call with the server keys", async () => {
    let f = fakeWoo(customers, "forged");
    vi.stubGlobal("fetch", f);
    expect((await listRoute.GET(req(as(10)), {})).status).toBe(401);
    expect((await itemRoute.PUT(req(as(10), "PUT"), item("11"))).status).toBe(401);
    expect((await mergeRoute.POST(req(as(10), "POST", { productIds: ["11"] }), {})).status).toBe(401);
    expect(keyCalls(f)).toHaveLength(0);
    f = fakeWoo(customers, { id: 9 });
    vi.stubGlobal("fetch", f);
    expect((await listRoute.GET(req(as(10)), {})).status).toBe(401);
    expect(keyCalls(f)).toHaveLength(0);
  });

  it("needs a session", async () => {
    const f = fakeWoo(customers, { id: 9 });
    vi.stubGlobal("fetch", f);
    expect((await listRoute.GET(req(""), {})).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
  });
});
