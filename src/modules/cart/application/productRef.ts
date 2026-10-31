import type { Product } from "@/modules/catalog";
import type { ProductRef } from "../domain/cart";

/** Snapshot of a catalog product for a cart line. */
export const toProductRef = (product: Product): ProductRef => ({
  id: product.id,
  slug: product.slug,
  title: product.title,
  image: product.images[0]?.thumbnail || product.images[0]?.src || null,
  unitPrice: product.price,
  regularUnitPrice: product.regularPrice,
  maxQuantity:
    product.stock.status === "out_of_stock" ? 0 : product.stock.status === "low" ? product.stock.quantity : null,
});
