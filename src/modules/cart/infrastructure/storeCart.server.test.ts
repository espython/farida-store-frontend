// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Node's Headers has getSetCookie(); this TypeScript lib does not declare it yet.
const setCookies = (res: Response): string[] => (res.headers as Headers & { getSetCookie(): string[] }).getSetCookie();
import { Money } from "@/shared/kernel/Money";
import { lineKeyFor, slugFromPermalink, toCart } from "./storeCartMapper";
import { addItem, clearCart, getCart, mergeLines, setQuantity } from "./cartClient.server";
import { clearCartToken, readCartToken, setCartToken } from "./cartTokenCookie.server";
import type { StoreCart, StoreCartItem } from "./storeCartDto";

const prices = (price: string, regular = price) => ({
  price,
  regular_price: regular,
  sale_price: price,
  currency_code: "EGP",
  currency_minor_unit: 2,
});
const item = (id: number, quantity = 1, over: Partial<StoreCartItem> = {}): StoreCartItem => ({
  key: `k${id}`,
  id,
  quantity,
  name: `Item ${id}`,
  permalink: `https://shop.test/product/item-${id}/`,
  images: [{ src: "https://shop.test/i.jpg", thumbnail: "https://shop.test/t.jpg" }],
  prices: prices("529000", "620000"),
  quantity_limits: { minimum: 1, maximum: 9, multiple_of: 1, editable: true },
  ...over,
});
const cart = (...items: StoreCartItem[]): StoreCart => ({
  items,
  items_count: items.length,
  totals: { total_items: "0", total_price: "0", currency_code: "EGP", currency_minor_unit: 2 },
});

describe("Store API cart mapper", () => {
  it("maps items to cart lines with price snapshot, sale price, thumbnail, slug and stock cap", () => {
    expect(toCart(cart(item(263, 2)))).toEqual({
      lines: [
        {
          quantity: 2,
          product: {
            id: "263",
            slug: "item-263",
            title: "Item 263",
            image: "https://shop.test/t.jpg",
            unitPrice: Money.of(529000),
            regularUnitPrice: Money.of(620000),
            maxQuantity: 9,
          },
        },
      ],
    });
  });

  it("drops a regular price that is not above the price; locks non-editable quantities", () => {
    const [line] = toCart(cart(item(1, 1, { prices: prices("1000"), quantity_limits: { minimum: 1, maximum: 1, multiple_of: 1, editable: false } }))).lines;
    expect(line.product.regularUnitPrice).toBeNull();
    expect(line.product.maxQuantity).toBe(1);
  });

  it("decodes Arabic slugs and finds line keys by product id", () => {
    expect(slugFromPermalink(`https://shop.test/product/${encodeURIComponent("خلاط")}/`)).toBe("خلاط");
    expect(lineKeyFor(cart(item(1), item(2)), "2")).toBe("k2");
    expect(lineKeyFor(cart(item(1)), "9")).toBeNull();
  });

  it("refuses other currencies", () => {
    expect(() => toCart(cart(item(1, 1, { prices: { ...prices("100"), currency_code: "USD" } })))).toThrow();
  });
});

describe("cart token cookie", () => {
  const req = (value?: string) =>
    new NextRequest("http://localhost/api/shop/cart", { headers: value ? { cookie: `cart_token=${value}` } : {} });

  it("returns the token only to the customer it was issued for", () => {
    expect(readCartToken(req("7.tok-abc"), "7")).toBe("tok-abc");
    expect(readCartToken(req("7.tok-abc"), "8")).toBeNull();
    expect(readCartToken(req("tok-without-owner"), "7")).toBeNull();
    expect(readCartToken(req(), "7")).toBeNull();
  });

  it("is httpOnly and can be cleared", () => {
    const res = NextResponse.json({});
    setCartToken(res, "7", "tok");
    const set = setCookies(res);
    expect(set[0]).toMatch(/^cart_token=7\.tok;/);
    expect(set[0]).toMatch(/HttpOnly/i);
    const cleared = NextResponse.json({});
    clearCartToken(cleared);
    expect(setCookies(cleared)[0]).toMatch(/Max-Age=0/);
  });
});

describe("Store API cart client", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const respond = (body: unknown, status = 200, token = "tok-1") =>
    new Response(JSON.stringify(body), { status, headers: { "cart-token": token } });
  const sent = (i: number) => {
    const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit & { headers: Record<string, string> }];
    return { path: new URL(url).pathname.replace("/wp-json", ""), init, body: init.body ? JSON.parse(init.body as string) : undefined };
  };

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

  it("reads the cart with the customer's JWT, never cached, and keeps the issued token", async () => {
    fetchMock.mockResolvedValueOnce(respond(cart(item(1)), 200, "tok-new"));
    const r = await getCart({ jwt: "jwt-7", cartToken: null });
    const { init } = sent(0);
    expect(init.headers.Authorization).toBe("Bearer jwt-7");
    expect(init.headers["Cart-Token"]).toBeUndefined();
    expect(init.cache).toBe("no-store");
    expect(r).toMatchObject({ cartToken: "tok-new", cart: { lines: [{ product: { id: "1" } }] } });
  });

  it("gets a token before the first change, then adds with it", async () => {
    fetchMock.mockResolvedValueOnce(respond(cart(), 200, "tok-a")).mockResolvedValueOnce(respond(cart(item(5, 2)), 201, "tok-a"));
    const r = await addItem({ jwt: "j", cartToken: null }, "5", 2);
    expect(sent(1)).toMatchObject({ path: "/wc/store/v1/cart/add-item", body: { id: 5, quantity: 2 } });
    expect(sent(1).init.headers["Cart-Token"]).toBe("tok-a");
    expect(r.cart.lines[0].quantity).toBe(2);
  });

  it("updates and removes by Woo's item key, found from the product id", async () => {
    fetchMock.mockResolvedValueOnce(respond(cart(item(5), item(6)))).mockResolvedValueOnce(respond(cart(item(5, 3), item(6))));
    await setQuantity({ jwt: "j", cartToken: "t" }, "5", 3);
    expect(sent(1)).toMatchObject({ path: "/wc/store/v1/cart/update-item", body: { key: "k5", quantity: 3 } });

    fetchMock.mockResolvedValueOnce(respond(cart(item(5), item(6)))).mockResolvedValueOnce(respond(cart(item(6))));
    const r = await setQuantity({ jwt: "j", cartToken: "t" }, "5", 0);
    expect(sent(3)).toMatchObject({ path: "/wc/store/v1/cart/remove-item", body: { key: "k5" } });
    expect(r.cart.lines.map((l) => l.product.id)).toEqual(["6"]);
  });

  it("clears all items", async () => {
    fetchMock.mockResolvedValueOnce(new Response("[]", { status: 200 })).mockResolvedValueOnce(respond(cart()));
    const r = await clearCart({ jwt: "j", cartToken: "t" });
    expect(sent(0)).toMatchObject({ path: "/wc/store/v1/cart/items", init: { method: "DELETE" } });
    expect(r.cart.lines).toEqual([]);
  });

  it("merges guest lines, skipping ones Woo refuses", async () => {
    fetchMock
      .mockResolvedValueOnce(respond(cart(item(1)), 201))
      .mockResolvedValueOnce(respond({ code: "woocommerce_rest_product_partially_out_of_stock", message: "x" }, 400))
      .mockResolvedValueOnce(respond(cart(item(1), item(3)), 201))
      .mockResolvedValueOnce(respond(cart(item(1), item(3))));
    const r = await mergeLines({ jwt: "j", cartToken: "t" }, [
      { productId: "1", quantity: 1 },
      { productId: "2", quantity: 9 },
      { productId: "3", quantity: 1 },
    ]);
    expect(r.skipped).toEqual(["2"]);
    expect(r.cart.lines.map((l) => l.product.id)).toEqual(["1", "3"]);
  });

  it("reports an expired JWT as unauthenticated, not as a shop outage", async () => {
    fetchMock.mockResolvedValueOnce(respond({ code: "jwt_auth_invalid_token" }, 403));
    await expect(getCart({ jwt: "old", cartToken: "t" })).rejects.toMatchObject({ code: "unauthenticated", status: 401 });
  });
});
