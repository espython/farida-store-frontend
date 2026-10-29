// Server entry of the catalog context. Import only from app/api and server components.
export {
  CATALOG_CACHE_TAG,
  getProductBySlug,
  listCategories,
  listColors,
  listProducts,
} from "./infrastructure/catalogClient.server";
export type { ProductQuery } from "./infrastructure/catalogClient.server";
