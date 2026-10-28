// Public API of the catalog context (client-safe: domain types and rules only).
// Server-side code is exposed through ./index.server for app/api routes.
export type {
  CategoryRef,
  Product,
  ProductAttribute,
  ProductImage,
  ProductPage,
  StockLevel,
  StockStatus,
} from "./domain/Product";
export type { Category } from "./domain/Category";
export { discountPercent, isOnSale } from "./domain/pricing";
export type { Color } from "./domain/Color";
export { DEFAULT_SORT, isProductSort, PRODUCT_SORTS } from "./domain/ProductSort";
export type { ProductSort } from "./domain/ProductSort";

// Application layer (client): RTK Query endpoints, filters slice, URL helpers, selectors.
export {
  catalogApi,
  useGetCategoriesQuery,
  useGetColorsQuery,
  useGetProductQuery,
  useGetProductsQuery,
  useSearchProductsQuery,
} from "./application/catalogApi";
export type { ProductArgs, ProductsArgs, SearchArgs } from "./application/catalogApi";
export {
  CATALOG_FILTERS_KEY,
  catalogFiltersActions,
  catalogFiltersReducer,
  initialFilters,
} from "./application/filtersSlice";
export type { CatalogFiltersState } from "./application/filtersSlice";
export { filtersToSearchParams, parseFilters } from "./application/urlFilters";
export {
  selectActiveFilterCount,
  selectCatalogFilters,
  selectProductsArgs,
} from "./application/selectors";
export { CATALOG_SOURCE } from "./catalogSource";
export type { CatalogSource } from "./catalogSource";
export { default as CatalogListing } from "./ui/CatalogListing";
export { default as CatalogProductCard } from "./ui/CatalogProductCard";
export { default as CategoryLinks } from "./ui/CategoryLinks";
export { default as CategoryTitle } from "./ui/CategoryTitle";
export { default as ColorOptions } from "./ui/ColorOptions";
export { default as BestSellers } from "./ui/BestSellers";
export { default as ProductDetails } from "./ui/ProductDetails";
export { default as ProductGallery } from "./ui/ProductGallery";
export { default as QuickSearch } from "./ui/QuickSearch";
export { findCategory, findColor, sameSlug } from "./application/lookups";
