import { describe, expect, it } from "vitest";
import { decodeEntities, toCategory, toProduct, toStockStatus } from "./productMapper";
import type { WooStoreCategory, WooStoreProduct } from "./wooProductDto";

const base: WooStoreProduct = {
  id: 42,
  name: "Pots &amp; Pans Set",
  slug: "pots-pans-set",
  sku: "PP-1",
  short_description: "<p>Short</p>",
  description: "<p>Long</p>",
  on_sale: true,
  prices: {
    price: "72000",
    regular_price: "80000",
    sale_price: "72000",
    currency_code: "EGP",
    currency_minor_unit: 2,
  },
  average_rating: "4.50",
  review_count: 8,
  images: [{ id: 1, src: "https://x/a.jpg", thumbnail: "https://x/a-150.jpg", alt: "Set" }],
  categories: [{ id: 5, name: "Cookware", slug: "cookware" }],
  attributes: [
    { name: "Color", taxonomy: "pa_color", terms: [{ id: 9, name: "Red", slug: "red" }] },
  ],
  is_in_stock: true,
  low_stock_remaining: null,
};

describe("toProduct", () => {
  it("maps a sale product into domain types with Money", () => {
    const p = toProduct(base, "en");
    expect(p).toMatchObject({
      id: "42",
      title: "Pots & Pans Set",
      price: { amount: 72000, currency: "EGP" },
      regularPrice: { amount: 80000, currency: "EGP" },
      stock: { status: "in_stock", quantity: null },
      rating: { average: 4.5, count: 8 },
      locale: "en",
    });
    expect(p.categories).toEqual([{ id: "5", slug: "cookware", title: "Cookware" }]);
    expect(p.attributes[0]).toEqual({
      slug: "pa_color",
      name: "Color",
      terms: [{ slug: "red", name: "Red" }],
    });
    expect(p.images[0].thumbnail).toBe("https://x/a-150.jpg");
  });

  it("has no regular price when not on sale", () => {
    const p = toProduct(
      {
        ...base,
        on_sale: false,
        prices: { ...base.prices, price: "80000", sale_price: "" },
      },
      "ar"
    );
    expect(p.regularPrice).toBeNull();
    expect(p.price.amount).toBe(80000);
    expect(p.locale).toBe("ar");
  });

  it("ignores a sale flag whose regular price is not higher", () => {
    const p = toProduct(
      { ...base, prices: { ...base.prices, price: "80000", regular_price: "80000" } },
      "en"
    );
    expect(p.regularPrice).toBeNull();
  });

  it("falls back for missing optional fields", () => {
    const p = toProduct(
      { id: 1, name: "A", slug: "a", on_sale: false, prices: { ...base.prices, price: "100", regular_price: "100" }, is_in_stock: true },
      "en"
    );
    expect(p).toMatchObject({ sku: "", images: [], categories: [], attributes: [], rating: { average: 0, count: 0 } });
  });

  it("rejects unsupported currencies and malformed prices instead of guessing", () => {
    expect(() =>
      toProduct({ ...base, prices: { ...base.prices, currency_code: "USD" } }, "en")
    ).toThrow(/Unsupported currency/);
    expect(() =>
      toProduct({ ...base, prices: { ...base.prices, price: "" } }, "en")
    ).toThrow();
  });
});

describe("toStockStatus", () => {
  it("covers in stock, low stock and out of stock", () => {
    expect(toStockStatus(true, null)).toEqual({ status: "in_stock", quantity: null });
    expect(toStockStatus(true, 2)).toEqual({ status: "low", quantity: 2 });
    expect(toStockStatus(false, null)).toEqual({ status: "out_of_stock", quantity: 0 });
  });
});

describe("toCategory", () => {
  const dto: WooStoreCategory = {
    id: 5,
    name: "Cook &amp; Bake",
    slug: "cook-bake",
    parent: 0,
    count: 12,
    image: { src: "https://x/c.jpg", alt: "" },
  };
  it("maps parent, count and image", () => {
    expect(toCategory(dto, "ar")).toEqual({
      id: "5",
      slug: "cook-bake",
      title: "Cook & Bake",
      parentId: null,
      productCount: 12,
      image: { src: "https://x/c.jpg", alt: "" },
      locale: "ar",
    });
    expect(toCategory({ ...dto, parent: 3, image: null }, "en")).toMatchObject({
      parentId: "3",
      image: null,
    });
  });
});

describe("decodeEntities", () => {
  it("decodes named and numeric entities and leaves unknown ones", () => {
    expect(decodeEntities("A &amp; B &#8211; C &#x27;D&#x27; &unknown;")).toBe(
      "A & B – C 'D' &unknown;"
    );
  });
});
