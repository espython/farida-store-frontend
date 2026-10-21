import { describe, expect, it } from "vitest";
import { legacyParamsToArgs } from "./legacyUrl";

const args = (qs: string, category?: string | null) =>
  legacyParamsToArgs(new URLSearchParams(qs), { locale: "en", category });

describe("legacyParamsToArgs", () => {
  it("uses sensible defaults for a bare URL", () => {
    expect(args("")).toEqual({
      locale: "en",
      perPage: 12,
      sort: "popularity",
      category: null,
      color: null,
      minPrice: null,
      maxPrice: null,
      onSale: false,
      search: null,
    });
  });

  it("maps the filter controls' existing URL params", () => {
    expect(
      args("salesonly=true&min_price=100&max_price=900&color=red&sort=price:ASC&psize=20&q=%20kettle%20", "cookware")
    ).toMatchObject({
      onSale: true,
      minPrice: 100,
      maxPrice: 900,
      color: "red",
      sort: "price_asc",
      perPage: 20,
      search: "kettle",
      category: "cookware",
    });
  });

  it("maps every sort option", () => {
    const sorts: Record<string, string> = {
      "": "popularity",
      rating: "rating",
      "createdAt:DESC": "newest",
      "price:ASC": "price_asc",
      "price:DESC": "price_desc",
    };
    for (const [legacy, mapped] of Object.entries(sorts)) {
      expect(args(`sort=${encodeURIComponent(legacy)}`).sort).toBe(mapped);
    }
  });

  it("ignores malformed or hostile values instead of passing them on", () => {
    expect(
      args("sort=bogus&psize=999&min_price=abc&max_price=0&color=a/b&salesonly=1", "../x")
    ).toMatchObject({
      sort: "popularity",
      perPage: 12,
      minPrice: null,
      maxPrice: null,
      color: null,
      onSale: false,
      category: null,
    });
    expect(args("psize=13").perPage).toBe(12);
  });
});
