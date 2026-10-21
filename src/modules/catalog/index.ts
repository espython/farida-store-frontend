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
