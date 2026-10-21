import { describe, expect, it } from "vitest";
import { initialFilters, type CatalogFiltersState } from "./filtersSlice";
import { filtersToSearchParams, parseFilters } from "./urlFilters";

const parse = (qs: string) => parseFilters(new URLSearchParams(qs));

describe("URL filters", () => {
  it("writes nothing for default filters", () => {
    expect(filtersToSearchParams(initialFilters).toString()).toBe("");
  });

  it("round-trips every filter", () => {
    const f: CatalogFiltersState = {
      ...initialFilters,
      category: "cookware",
      color: "red",
      minPrice: 100,
      maxPrice: 900,
      onSale: true,
      sort: "price_desc",
      page: 3,
      search: "pots & pans",
    };
    expect(parse(filtersToSearchParams(f).toString())).toEqual(f);
  });

  it("falls back to defaults for hostile or malformed values", () => {
    const f = parse(
      "sort=bogus&page=-1&minPrice=abc&maxPrice=0&category=a/b&color=..&onSale=yes&q=%20%20"
    );
    expect(f).toEqual(initialFilters);
    expect(parse("page=99999").page).toBe(1);
    expect(parse("minPrice=0").minPrice).toBe(0);
    expect(parse(`q=${"x".repeat(300)}`).search).toHaveLength(100);
  });
});
