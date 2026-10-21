// Server entry of the catalog context. Import only from app/api and server components.
export {
  getProductBySlug,
  listCategories,
  listProducts,
} from "./infrastructure/catalogClient.server";
export type { ProductQuery, ProductSort } from "./infrastructure/catalogClient.server";
