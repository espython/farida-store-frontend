import { describe, expect, it } from "vitest";
import { makeStore } from "@/store";
import { Money } from "@/shared/kernel/Money";
import {
  buildQuery,
  productQuery,
  productsQuery,
  searchQuery,
} from "./catalogApi";
import { catalogFiltersActions } from "./filtersSlice";
import { selectActiveFilterCount, selectProductsArgs } from "./selectors";

describe("catalog query builders", () => {
  it("drops empty values and orders keys so equal args share one cache entry", () => {
    expect(buildQuery({ b: 2, a: 1, c: null, d: undefined, e: "", f: false, g: true })).toBe(
      "a=1&b=2&g=1"
    );
    expect(productsQuery({ locale: "en", page: 2, category: "x" })).toBe(
      productsQuery({ category: "x", page: 2, locale: "en" })
    );
  });

  it("builds product, search and detail URLs", () => {
    expect(
      productsQuery({ locale: "ar", sort: "price_asc", minPrice: 100, onSale: true })
    ).toBe("products?locale=ar&minPrice=100&onSale=1&sort=price_asc");
    expect(searchQuery({ locale: "en", q: "pots & pans" })).toBe(
      "search?locale=en&q=pots+%26+pans"
    );
    expect(productQuery({ locale: "ar", slug: "قدر ضغط" })).toBe(
      `products/${encodeURIComponent("قدر ضغط")}?locale=ar`
    );
  });
});

describe("store wiring", () => {
  it("mounts the filters slice and derives query args and counts from it", () => {
    const store = makeStore();
    expect(selectActiveFilterCount(store.getState())).toBe(0);
    store.dispatch(catalogFiltersActions.setCategory("cookware"));
    store.dispatch(catalogFiltersActions.setPriceRange({ min: 100, max: null }));
    store.dispatch(catalogFiltersActions.setPage(2));
    const state = store.getState();
    expect(selectActiveFilterCount(state)).toBe(2);
    expect(selectProductsArgs(state, "ar")).toMatchObject({
      locale: "ar",
      category: "cookware",
      minPrice: 100,
      page: 2,
    });
    // Sanity: the module still exports Money-based domain types through the kernel.
    expect(Money.of(1).amount).toBe(1);
  });
});
