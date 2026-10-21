// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProductBySlug, listCategories, listProducts } from "./catalogClient.server";
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
      .mockResolvedValueOnce(json([category(7, "cookware")]))
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

    const u = urlOf(fetchMock.mock.calls[1]);
    expect(Object.fromEntries(u.searchParams)).toMatchObject({
      page: "2",
      per_page: "12",
      orderby: "price",
      order: "asc",
      category: "7",
      min_price: "10000",
      max_price: "90000",
      lang: "ar",
      "attributes[0][attribute]": "pa_color",
      "attributes[0][slug]": "red",
    });
    expect(page).toMatchObject({ page: 2, total: 25, totalPages: 3 });
    expect(page.items[0]).toMatchObject({ id: "1", locale: "ar" });
  });

  it("returns an empty page for an unknown category instead of the whole catalog", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json([category(7, "cookware")]));
    vi.stubGlobal("fetch", fetchMock);
    const page = await listProducts({ ...query, category: "nope" });
    expect(page).toEqual({ items: [], page: 2, total: 0, totalPages: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  it("finds a product by slug, including percent-encoded Arabic slugs", async () => {
    const encoded = "%d9%82%d8%af%d8%b1";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json([product({ slug: encoded })]))
    );
    const p = await getProductBySlug("قدر", "ar");
    expect(p.slug).toBe(encoded);
  });

  it("404s when Woo returns nothing or ignores the slug filter", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json([])));
    await expect(getProductBySlug("kettle", "en")).rejects.toMatchObject({ status: 404 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json([product({ slug: "other" })])));
    await expect(getProductBySlug("kettle", "en")).rejects.toMatchObject({ status: 404 });
  });
});
