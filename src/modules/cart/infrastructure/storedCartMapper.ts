import { Money } from "@/shared/kernel/Money";
import { addLine, emptyCart, MAX_CART_LINES, type Cart, type ProductRef } from "../domain/cart";
import type { StoredCartLineV1, StoredCartV1 } from "./storedCartDto";

const isMinorUnits = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;

const toProductRef = (raw: Partial<StoredCartLineV1>): ProductRef | null => {
  if (typeof raw.id !== "string" || !raw.id || typeof raw.slug !== "string" || typeof raw.title !== "string") {
    return null;
  }
  if (!isMinorUnits(raw.price)) return null;
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    image: typeof raw.image === "string" ? raw.image : null,
    unitPrice: Money.of(raw.price),
    regularUnitPrice: isMinorUnits(raw.regularPrice) ? Money.of(raw.regularPrice) : null,
    maxQuantity: typeof raw.maxQty === "number" && Number.isFinite(raw.maxQty) ? raw.maxQty : null,
  };
};

/**
 * Stored JSON → Cart. Storage is user-editable and may hold an older or
 * foreign shape, so anything unrecognised is dropped rather than trusted.
 * Lines go through the domain's addLine, which applies the same quantity,
 * stock and size rules as a shopper's own add; duplicates keep the first line.
 */
export const toCart = (data: unknown): Cart => {
  const dto = data as Partial<StoredCartV1> | null;
  if (!dto || dto.v !== 1 || !Array.isArray(dto.lines)) return emptyCart();

  let cart = emptyCart();
  const seen = new Set<string>();
  for (const raw of dto.lines) {
    if (!raw || typeof raw !== "object") continue;
    const product = toProductRef(raw);
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    const qty = typeof raw.qty === "number" && raw.qty > 0 ? raw.qty : 1;
    cart = addLine(cart, product, qty);
    if (cart.lines.length === MAX_CART_LINES) break;
  }
  return cart;
};

/** Cart → stored JSON. */
export const toStoredCart = (cart: Cart): StoredCartV1 => ({
  v: 1,
  lines: cart.lines.map(({ product: p, quantity }) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    image: p.image,
    price: p.unitPrice.amount,
    regularPrice: p.regularUnitPrice?.amount ?? null,
    maxQty: p.maxQuantity,
    qty: quantity,
  })),
});
