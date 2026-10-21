import { isProductSort } from "../domain/ProductSort";
import {
  DEFAULT_PER_PAGE,
  initialFilters,
  type CatalogFiltersState,
} from "./filtersSlice";

type ParamsLike = { get(name: string): string | null };

const toInt = (raw: string | null, min: number, max: number): number | null => {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

const toSlug = (raw: string | null): string | null =>
  raw && raw.length <= 200 && !/[\s/\\?#]/.test(raw) && !raw.includes("..") ? raw : null;

/** Reads filters from a URL. Unknown or invalid values fall back to the defaults. */
export function parseFilters(params: ParamsLike): CatalogFiltersState {
  const sort = params.get("sort");
  return {
    category: toSlug(params.get("category")),
    color: toSlug(params.get("color")),
    minPrice: toInt(params.get("minPrice"), 0, 10_000_000),
    maxPrice: toInt(params.get("maxPrice"), 1, 10_000_000),
    onSale: params.get("onSale") === "1",
    sort: isProductSort(sort) ? sort : initialFilters.sort,
    page: toInt(params.get("page"), 1, 1000) ?? 1,
    perPage: initialFilters.perPage,
    search: (params.get("q") ?? "").trim().slice(0, 100),
  };
}

/** Writes only non-default filters so shareable URLs stay short. */
export function filtersToSearchParams(f: CatalogFiltersState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.category) p.set("category", f.category);
  if (f.color) p.set("color", f.color);
  if (f.minPrice !== null) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice !== null) p.set("maxPrice", String(f.maxPrice));
  if (f.onSale) p.set("onSale", "1");
  if (f.sort !== initialFilters.sort) p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  if (f.search) p.set("q", f.search);
  return p;
}

export { DEFAULT_PER_PAGE };
