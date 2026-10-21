import { describe, expect, it } from "vitest";
import {
  catalogFiltersActions as a,
  catalogFiltersReducer as reducer,
  initialFilters,
} from "./filtersSlice";

const run = (...actions: Parameters<typeof reducer>[1][]) =>
  actions.reduce(reducer, initialFilters);

describe("catalog filters slice", () => {
  it("resets to page 1 whenever a filter changes", () => {
    for (const change of [
      a.setCategory("cookware"),
      a.setColor("red"),
      a.setPriceRange({ min: 100, max: 900 }),
      a.setOnSale(true),
      a.setSort("price_asc"),
      a.setSearch("kettle"),
    ]) {
      expect(run(a.setPage(4), change).page).toBe(1);
    }
  });

  it("keeps filters when only the page changes and sanitises the page", () => {
    const s = run(a.setCategory("cookware"), a.setPage(3));
    expect(s).toMatchObject({ category: "cookware", page: 3 });
    expect(run(a.setPage(-2)).page).toBe(1);
    expect(run(a.setPage(2.9)).page).toBe(2);
    expect(run(a.setPage(NaN)).page).toBe(1);
  });

  it("hydrates and resets", () => {
    const hydrated = run(a.hydrateFilters({ ...initialFilters, color: "blue", page: 2 }));
    expect(hydrated).toMatchObject({ color: "blue", page: 2 });
    expect(run(a.setColor("red"), a.resetFilters())).toEqual(initialFilters);
  });
});
