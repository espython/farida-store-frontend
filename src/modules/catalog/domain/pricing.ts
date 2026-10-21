import type { Product } from "./Product";

export const isOnSale = (p: Pick<Product, "regularPrice">): boolean =>
  p.regularPrice !== null;

/** Whole-number discount percentage for badges, 0 when not on sale. */
export function discountPercent(p: Pick<Product, "price" | "regularPrice">): number {
  if (!p.regularPrice || p.regularPrice.amount <= 0) return 0;
  const off = p.regularPrice.amount - p.price.amount;
  if (off <= 0) return 0;
  return Math.round((off / p.regularPrice.amount) * 100);
}
