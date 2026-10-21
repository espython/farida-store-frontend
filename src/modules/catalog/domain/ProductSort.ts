export const PRODUCT_SORTS = [
  "newest",
  "price_asc",
  "price_desc",
  "popularity",
  "rating",
  "title",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const DEFAULT_SORT: ProductSort = "newest";

export const isProductSort = (value: unknown): value is ProductSort =>
  typeof value === "string" && (PRODUCT_SORTS as readonly string[]).includes(value);
