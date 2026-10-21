import type { Locale } from "@/shared/kernel/Locale";
import type { ProductsArgs } from "./catalogApi";
import { CATALOG_FILTERS_KEY, type CatalogFiltersState } from "./filtersSlice";

// Structural root so the module does not import the store (composition root).
type WithFilters = { [CATALOG_FILTERS_KEY]: CatalogFiltersState };

export const selectCatalogFilters = (state: WithFilters) => state[CATALOG_FILTERS_KEY];

/** Query args for getProducts from the current filters. */
export const selectProductsArgs = (state: WithFilters, locale: Locale): ProductsArgs => {
  const f = selectCatalogFilters(state);
  return {
    locale,
    page: f.page,
    perPage: f.perPage,
    sort: f.sort,
    category: f.category,
    color: f.color,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    onSale: f.onSale,
  };
};

export const selectActiveFilterCount = (state: WithFilters): number => {
  const f = selectCatalogFilters(state);
  return [
    f.category,
    f.color,
    f.minPrice !== null || f.maxPrice !== null,
    f.onSale,
    f.search,
  ].filter(Boolean).length;
};
