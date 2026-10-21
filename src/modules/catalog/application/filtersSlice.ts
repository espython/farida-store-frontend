import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_SORT, type ProductSort } from "../domain/ProductSort";

export const DEFAULT_PER_PAGE = 12;

export interface CatalogFiltersState {
  category: string | null;
  color: string | null;
  /** Whole EGP, like the BFF query. */
  minPrice: number | null;
  maxPrice: number | null;
  onSale: boolean;
  sort: ProductSort;
  page: number;
  perPage: number;
  search: string;
}

export const initialFilters: CatalogFiltersState = {
  category: null,
  color: null,
  minPrice: null,
  maxPrice: null,
  onSale: false,
  sort: DEFAULT_SORT,
  page: 1,
  perPage: DEFAULT_PER_PAGE,
  search: "",
};

// Every filter change goes back to the first page; only setPage keeps it.
const slice = createSlice({
  name: "catalogFilters",
  initialState: initialFilters,
  reducers: {
    setCategory(state, a: PayloadAction<string | null>) {
      state.category = a.payload;
      state.page = 1;
    },
    setColor(state, a: PayloadAction<string | null>) {
      state.color = a.payload;
      state.page = 1;
    },
    setPriceRange(state, a: PayloadAction<{ min: number | null; max: number | null }>) {
      state.minPrice = a.payload.min;
      state.maxPrice = a.payload.max;
      state.page = 1;
    },
    setOnSale(state, a: PayloadAction<boolean>) {
      state.onSale = a.payload;
      state.page = 1;
    },
    setSort(state, a: PayloadAction<ProductSort>) {
      state.sort = a.payload;
      state.page = 1;
    },
    setSearch(state, a: PayloadAction<string>) {
      state.search = a.payload;
      state.page = 1;
    },
    setPage(state, a: PayloadAction<number>) {
      state.page = Math.max(1, Math.floor(a.payload) || 1);
    },
    /** Replace everything, e.g. when hydrating from the URL. */
    hydrateFilters(_state, a: PayloadAction<CatalogFiltersState>) {
      return a.payload;
    },
    resetFilters() {
      return initialFilters;
    },
  },
});

export const catalogFiltersActions = slice.actions;
export const catalogFiltersReducer = slice.reducer;
export const CATALOG_FILTERS_KEY = slice.name;
