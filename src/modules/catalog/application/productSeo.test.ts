import { describe, expect, it } from "vitest";
import { Money } from "@/shared/kernel/Money";
import type { Product } from "../domain/Product";
import { productJsonLd, productMetaDescription, serializeJsonLd } from "./productSeo";

const product = (over: Partial<Product> = {}): Product => ({
  id: "1",
  slug: "kettle",
  title: "Kettle",
  shortDescription: "<p>Boils water &amp; more.</p>",
  description: "<p>Long text</p>",
  sku: "K-1",
  price: Money.fromDecimal("800.00"),
  regularPrice: Money.fromDecimal("1000.00"),
  stock: { status: "low", quantity: 2 },
  images: [{ id: 1, src: "https://shop.test/k.jpg", thumbnail: "https://shop.test/k-300.jpg", alt: "" }],
  categories: [{ id: "5", slug: "kitchen", title: "Kitchen" }],
  attributes: [],
  rating: { average: 4.5, count: 2 },
  locale: "en",
  ...over,
});

describe("productMetaDescription", () => {
  it("uses the short description as plain text, falling back to the full one", () => {
    expect(productMetaDescription(product())).toBe("Boils water & more.");
    expect(productMetaDescription(product({ shortDescription: "" }))).toBe("Long text");
  });

  it("cuts long text at a word boundary", () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    const text = productMetaDescription(product({ shortDescription: long }));
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text).toMatch(/word\d+…$/);
  });
});

describe("productJsonLd", () => {
  it("describes the product with its current price and stock", () => {
    const ld = productJsonLd(product(), "https://site.test/en/product/kettle");
    expect(ld).toMatchObject({
      "@type": "Product",
      name: "Kettle",
      sku: "K-1",
      image: ["https://shop.test/k.jpg"],
      category: "Kitchen",
      aggregateRating: { ratingValue: 4.5, reviewCount: 2 },
      offers: {
        price: "800.00",
        priceCurrency: "EGP",
        availability: "https://schema.org/LimitedAvailability",
        url: "https://site.test/en/product/kettle",
      },
    });
  });

  it("leaves out empty optional fields", () => {
    const ld = productJsonLd(
      product({ sku: "", images: [], categories: [], rating: { average: 0, count: 0 }, shortDescription: "", description: "" }),
      "u"
    );
    for (const key of ["sku", "image", "category", "aggregateRating", "description"]) {
      expect(ld).not.toHaveProperty(key);
    }
  });
});

describe("serializeJsonLd", () => {
  it("cannot close the surrounding script tag", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json).name).toBe("</script><script>alert(1)</script>");
  });
});
