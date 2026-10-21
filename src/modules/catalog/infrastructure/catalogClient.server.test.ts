// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProductBySlug, listCategories, listColors, listProducts } from "./catalogClient.server";
import type { WooStoreCategory, WooStoreProduct } from "./wooProductDto";

const product = (over: Partial<WooStoreProduct> = {}): WooStoreProduct => ({
  id: 1,
  name: "Kettle",
  slug: "kettle",
  on_sale: false,
  prices: {
    price: "50000",
    regular_price: "50000",
    sale_price: "",
    currency_code: "EGP",
    currency_minor_unit: 2,
  },
  is_in_stock: true,
  ...over,
});
const category = (id: number, slug: string): WooStoreCategory => ({
  id,
  name: slug,
  slug,
  parent: 0,
  count: 1,
});

const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers });

const urlOf = (call: unknown[]) => new URL(call[0] as string);

describe("catalog client", () => {
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const query = {
    locale: "en" as const,
    page: 2,
    perPage: 12,
    sort: "price_asc" as const,
  };

  it("lists products with filters, sort, locale and pagination headers", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        json([product()], { "x-wp-total": "25", "x-wp-totalpages": "3" })
      );
    vi.stubGlobal("fetch", fetchMock);

    const page = await listProducts({
      ...query,
      locale: "ar",
      category: "cookware",
      minPrice: 10000,
      maxPrice: 90000,
      color: "red",
    });

    const u = urlOf(fetchMock.mock.calls[0]);
    expect(Object.fromEntries(u.searchParams)).toMatchObject({
      page: "2",
      per_page: "12",
      orderby: "price",
      order: "asc",
      category: "cookware",
      min_price: "10000",
      max_price: "90000",
      lang: "ar",
      "attributes[0][attribute]": "pa_color",
      "attributes[0][slug]": "red",
    });
    expect(page).toMatchObject({ page: 2, total: 25, totalPages: 3 });
    expect(page.items[0]).toMatchObject({ id: "1", locale: "ar" });
  });

  it("lists categories for the locale", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([category(7, "cookware")]));
    vi.stubGlobal("fetch", fetchMock);
    const cats = await listCategories("ar");
    expect(urlOf(fetchMock.mock.calls[0]).searchParams.get("lang")).toBe("ar");
    expect(cats[0]).toMatchObject({ slug: "cookware", locale: "ar" });
  });

  it("sends public catalog reads without credentials", async () => {
    process.env.WC_CONSUMER_KEY = "ck_x";
    process.env.WC_CONSUMER_SECRET = "cs_y";
    const fetchMock = vi.fn().mockResolvedValue(json([]));
    vi.stubGlobal("fetch", fetchMock);
    await listProducts(query);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("fetches a product through /products/{slug}, including Arabic slugs", async () => {
    const encoded = "%d9%82%d8%af%d8%b1";
    const fetchMock = vi.fn().mockResolvedValue(json(product({ slug: encoded })));
    vi.stubGlobal("fetch", fetchMock);
    const p = await getProductBySlug("%D9%82%D8%AF%D8%B1", "ar");
    expect(p.slug).toBe(encoded);
    // Re-encoded from the decoded text, whatever case the caller used.
    expect(urlOf(fetchMock.mock.calls[0]).pathname).toBe(
      "/wp-json/wc/store/v1/products/%D9%82%D8%AF%D8%B1"
    );
  });

  it("404s on an upstream 404 and when the slug does not match (numeric ids)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 404 }))
    );
    await expect(getProductBySlug("kettle", "en")).rejects.toMatchObject({ status: 404 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(product({ id: 1, slug: "kettle" }))));
    await expect(getProductBySlug("1", "en")).rejects.toMatchObject({ status: 404 });
  });

  it("escapes ampersands in search terms to match Woo's stored titles", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json([]));
    vi.stubGlobal("fetch", fetchMock);
    await listProducts({ ...query, search: "pots & pans" });
    expect(urlOf(fetchMock.mock.calls[0]).searchParams.get("search")).toBe("pots &amp; pans");
  });

  it("lists colours from the pa_color attribute terms, or none when it does not exist", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json([{ id: 3, name: "Size", taxonomy: "pa_size" }, { id: 1, name: "Color", taxonomy: "pa_color" }]))
      .mockResolvedValueOnce(json([{ id: 29, name: "Red", slug: "red", description: "#ff0000" }]));
    vi.stubGlobal("fetch", fetchMock);
    const colors = await listColors("en");
    expect(urlOf(fetchMock.mock.calls[1]).pathname).toBe(
      "/wp-json/wc/store/v1/products/attributes/1/terms"
    );
    expect(colors).toEqual([{ id: "29", slug: "red", name: "Red", hex: "#ff0000", locale: "en" }]);

    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => json([{ id: 3, name: "Size", taxonomy: "pa_size" }])));
    expect(await listColors("en")).toEqual([]);
  });

  it("passes the on-sale filter", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json([]));
    vi.stubGlobal("fetch", fetchMock);
    await listProducts({ ...query, onSale: true });
    await listProducts(query);
    expect(urlOf(fetchMock.mock.calls[0]).searchParams.get("on_sale")).toBe("true");
    expect(urlOf(fetchMock.mock.calls[1]).searchParams.has("on_sale")).toBe(false);
  });

  it("restricts listings to catalog-visible products and search to search-visible", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json([]));
    vi.stubGlobal("fetch", fetchMock);
    await listProducts(query);
    await listProducts({ ...query, search: "kettle" });
    expect(urlOf(fetchMock.mock.calls[0]).searchParams.get("catalog_visibility")).toBe("catalog");
    expect(urlOf(fetchMock.mock.calls[1]).searchParams.get("catalog_visibility")).toBe("search");
  });
});
