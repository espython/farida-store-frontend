// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Node's Headers has getSetCookie(); this TypeScript lib does not declare it yet.
const setCookies = (res: Response): string[] => (res.headers as Headers & { getSetCookie(): string[] }).getSetCookie();
import * as cartRoute from "./route";
import * as itemsRoute from "./items/route";
import * as itemRoute from "./items/[productId]/route";
import * as mergeRoute from "./merge/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (id: number, exp = Math.floor(Date.now() / 1000) + 3600) =>
  `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp, data: { user: { id } } })}.sig`;
const storeCart = (ids: number[]) => ({
  items: ids.map((id) => ({
    key: `k${id}`,
    id,
    quantity: 1,
    name: `Item ${id}`,
    permalink: `https://shop.test/product/item-${id}/`,
    prices: { price: "1000", regular_price: "1000", sale_price: "1000", currency_code: "EGP", currency_minor_unit: 2 },
    quantity_limits: { minimum: 1, maximum: 9, multiple_of: 1, editable: true },
  })),
  items_count: ids.length,
  totals: { total_items: "0", total_price: "0", currency_code: "EGP", currency_minor_unit: 2 },
});
const respond = (body: unknown, status = 200, token = "tok-new") =>
  new Response(JSON.stringify(body), { status, headers: { "cart-token": token } });

const req = (path: string, method = "GET", cookie = "", body?: unknown) =>
  new NextRequest(new URL(path, "http://localhost"), {
    method,
    headers: cookie ? { cookie } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe("/api/shop/cart", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("needs a signed-in customer (guests keep their cart in the browser)", async () => {
    expect((await cartRoute.GET(req("/api/shop/cart"), {})).status).toBe(401);
    const expired = `credentials=${jwt(7, Math.floor(Date.now() / 1000) - 10)}`;
    expect((await cartRoute.GET(req("/api/shop/cart", "GET", expired), {})).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the cart uncached and binds the issued token to the customer", async () => {
    fetchMock.mockResolvedValueOnce(respond(storeCart([1])));
    const res = await cartRoute.GET(req("/api/shop/cart", "GET", `credentials=${jwt(7)}`), {});
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect((await res.json()).cart.lines[0].product.id).toBe("1");
    expect(setCookies(res).find((c) => c.startsWith("cart_token="))).toMatch(/^cart_token=7\.tok-new;.*HttpOnly/i);
  });

  it("ignores another customer's cart token", async () => {
    fetchMock.mockResolvedValueOnce(respond(storeCart([])));
    await cartRoute.GET(req("/api/shop/cart", "GET", `credentials=${jwt(8)}; cart_token=7.tok-of-7`), {});
    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> };
    expect(init.headers["Cart-Token"]).toBeUndefined();
  });

  it("adds, changes and removes lines with validated input", async () => {
    const cookie = `credentials=${jwt(7)}; cart_token=7.tok`;
    expect((await itemsRoute.POST(req("/api/shop/cart/items", "POST", cookie, { productId: "x", quantity: 1 }), {})).status).toBe(400);
    expect((await itemsRoute.POST(req("/api/shop/cart/items", "POST", cookie, { productId: "5", quantity: 0 }), {})).status).toBe(400);

    fetchMock.mockResolvedValueOnce(respond(storeCart([5]), 201));
    expect((await itemsRoute.POST(req("/api/shop/cart/items", "POST", cookie, { productId: "5", quantity: 2 }), {})).status).toBe(200);

    fetchMock.mockResolvedValueOnce(respond(storeCart([5]))).mockResolvedValueOnce(respond(storeCart([5])));
    const patch = await itemRoute.PATCH(req("/api/shop/cart/items/5", "PATCH", cookie, { quantity: 3 }), { params: { productId: "5" } });
    expect(patch.status).toBe(200);

    fetchMock.mockResolvedValueOnce(respond(storeCart([5]))).mockResolvedValueOnce(respond(storeCart([])));
    const del = await itemRoute.DELETE(req("/api/shop/cart/items/5", "DELETE", cookie), { params: { productId: "5" } });
    expect((await del.json()).cart.lines).toEqual([]);

    expect((await itemRoute.DELETE(req("/api/shop/cart/items/abc", "DELETE", cookie), { params: { productId: "abc" } })).status).toBe(400);
  });

  it("passes Woo's stock error through for the UI", async () => {
    fetchMock.mockResolvedValueOnce(respond({ code: "woocommerce_rest_product_partially_out_of_stock", message: "x" }, 400));
    const res = await itemsRoute.POST(
      req("/api/shop/cart/items", "POST", `credentials=${jwt(7)}; cart_token=7.tok`, { productId: "5", quantity: 9 }),
      {}
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("woocommerce_rest_product_partially_out_of_stock");
  });

  it("merges the guest cart and reports skipped lines", async () => {
    fetchMock
      .mockResolvedValueOnce(respond(storeCart([1]), 201))
      .mockResolvedValueOnce(respond({ code: "woocommerce_rest_product_out_of_stock" }, 400))
      .mockResolvedValueOnce(respond(storeCart([1])));
    const res = await mergeRoute.POST(
      req("/api/shop/cart/merge", "POST", `credentials=${jwt(7)}; cart_token=7.tok`, {
        lines: [
          { productId: "1", quantity: 1 },
          { productId: "2", quantity: 1 },
        ],
      }),
      {}
    );
    expect(await res.json()).toMatchObject({ skipped: ["2"], cart: { lines: [{ product: { id: "1" } }] } });
  });
});
