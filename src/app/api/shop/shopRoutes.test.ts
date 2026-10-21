// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as products from "./products/route";
import * as productDetail from "./products/[slug]/route";
import * as search from "./search/route";
import * as categories from "./categories/route";
import * as colors from "./colors/route";

const req = (path: string, method = "GET") =>
  new NextRequest(new URL(path, "http://localhost"), { method });

const prices = {
  price: "50000",
  regular_price: "50000",
  sale_price: "",
  currency_code: "EGP",
  currency_minor_unit: 2,
};
const woo = (slug = "kettle") => ({
  id: 1,
  name: "Kettle",
  slug,
  on_sale: false,
  prices,
  is_in_stock: true,
});

describe("/api/shop routes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify([woo()])));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("GET /products returns a ProductPage and converts EGP prices to minor units", async () => {
    const res = await products.GET(req("/api/shop/products?minPrice=100&maxPrice=900&locale=ar"), {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items[0]).toMatchObject({ id: "1", price: { amount: 50000, currency: "EGP" } });
    const u = new URL(fetchMock.mock.calls[0][0]);
    expect(u.searchParams.get("min_price")).toBe("10000");
    expect(u.searchParams.get("max_price")).toBe("90000");
    expect(u.searchParams.get("lang")).toBe("ar");
  });

  it("rejects invalid filters with the shared 400 shape", async () => {
    for (const q of ["?page=0", "?sort=bogus", "?locale=fr", "?minPrice=500&maxPrice=100", "?maxPrice=0", "?perPage=500"]) {
      const res = await products.GET(req(`/api/shop/products${q}`), {});
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("validation_error");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET /products/:slug returns the product or 404", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes("/products/kettle")
        ? new Response(JSON.stringify(woo()))
        : new Response("{}", { status: 404 })
    );
    const ok = await productDetail.GET(req("/api/shop/products/kettle"), { params: { slug: "kettle" } });
    expect(ok.status).toBe(200);
    expect((await ok.json()).slug).toBe("kettle");
    const missing = await productDetail.GET(req("/api/shop/products/other"), { params: { slug: "other" } });
    expect(missing.status).toBe(404);
  });

  it("GET /search requires a query of at least two characters", async () => {
    expect((await search.GET(req("/api/shop/search?q=k"), {})).status).toBe(400);
    expect((await search.GET(req("/api/shop/search"), {})).status).toBe(400);
    const ok = await search.GET(req("/api/shop/search?q=kettle"), {});
    expect(ok.status).toBe(200);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("search")).toBe("kettle");
  });

  it("GET /categories maps categories", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify([{ id: 5, name: "Cookware", slug: "cookware", parent: 0, count: 3 }]))
    );
    const res = await categories.GET(req("/api/shop/categories"), {});
    expect((await res.json())[0]).toMatchObject({ slug: "cookware", locale: "en" });
  });

  it("GET /products accepts onSale and rejects non-boolean values", async () => {
    const ok = await products.GET(req("/api/shop/products?onSale=1"), {});
    expect(ok.status).toBe(200);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("on_sale")).toBe("true");
    expect((await products.GET(req("/api/shop/products?onSale=maybe"), {})).status).toBe(400);
  });

  it("GET /colors returns mapped colours", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      new Response(
        JSON.stringify(
          url.endsWith("/attributes")
            ? [{ id: 1, name: "Color", taxonomy: "pa_color" }]
            : [{ id: 29, name: "Red", slug: "red", description: "#ff0000" }]
        )
      )
    );
    const res = await colors.GET(req("/api/shop/colors?locale=ar"), {});
    expect(await res.json()).toEqual([
      { id: "29", slug: "red", name: "Red", hex: "#ff0000", locale: "ar" },
    ]);
  });

  it("only serves GET: other methods get a JSON 405", async () => {
    for (const mod of [products, productDetail, search, categories, colors]) {
      const res = await mod.POST(req("/api/shop/x", "POST"), { params: { slug: "x" } });
      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toBe("GET");
    }
  });

  it("hides upstream failures behind a 502", async () => {
    fetchMock.mockImplementation(async () => new Response("<html>db error</html>", { status: 500 }));
    const res = await products.GET(req("/api/shop/products"), {});
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("db error");
  });
});
