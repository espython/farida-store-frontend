// Server entry of the catalog context. Import only from app/api and server components.
export {
  CATALOG_CACHE_TAG,
  getProductBySlug,
  listCategories,
  listColors,
  listProducts,
} from "./infrastructure/catalogClient.server";
export type { ProductQuery } from "./infrastructure/catalogClient.server";

// Domain rules route handlers validate with (server-safe re-exports).
export { DEFAULT_SORT, isProductSort, PRODUCT_SORTS } from "./domain/ProductSort";
export type { ProductSort } from "./domain/ProductSort";
