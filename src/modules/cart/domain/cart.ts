import { Money } from "@/shared/kernel/Money";

/** Hard cap per line, whatever the stock says: guards against typos like 100 instead of 10. */
export const MAX_LINE_QUANTITY = 20;
/** Bounds what a guest cart can put into browser storage. */
export const MAX_CART_LINES = 50;

/**
 * What the cart keeps of a catalog product: enough to render a line without
 * refetching, plus the price at the time it was added. The server cart (C2) is
 * authoritative for prices at checkout; this is a snapshot.
 */
export interface ProductRef {
  id: string;
  slug: string;
  title: string;
  /** Thumbnail URL, or null when the product has no image. */
  image: string | null;
  unitPrice: Money;
  /** Price before the sale; null when not on sale. */
  regularUnitPrice: Money | null;
  /** Units the shopper may buy (low-stock remainder); null when unlimited/unknown. */
  maxQuantity: number | null;
}

export interface CartLine {
  product: ProductRef;
  quantity: number;
}

export interface Cart {
  lines: CartLine[];
}

export interface CartTotals {
  /** Sum of quantities, for the header badge. */
  itemCount: number;
  /** What the lines cost now (sale prices × quantity). */
  subtotal: Money;
  /** Regular-price total minus subtotal, i.e. what the sale saves. */
  savings: Money;
}

export const emptyCart = (): Cart => ({ lines: [] });

/** Largest quantity allowed for this product. 0 means it cannot be bought. */
export const lineLimit = (product: ProductRef): number =>
  product.maxQuantity === null
    ? MAX_LINE_QUANTITY
    : Math.max(0, Math.min(MAX_LINE_QUANTITY, Math.floor(product.maxQuantity)));

/** Whole number between 1 and the line limit; NaN and fractions are cleaned up. */
export const clampQuantity = (quantity: number, product: ProductRef): number => {
  const limit = lineLimit(product);
  if (limit === 0) return 0;
  const whole = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  return Math.min(limit, Math.max(1, whole));
};

/**
 * Add units of a product. An existing line keeps its position and gets the
 * fresh snapshot (the price may have changed since it was added); the
 * quantities add up and are capped. Unbuyable products and a full cart are
 * no-ops: the UI disables the button, this is the backstop.
 */
export const addLine = (cart: Cart, product: ProductRef, quantity = 1): Cart => {
  if (lineLimit(product) === 0) return cart;
  const index = cart.lines.findIndex((l) => l.product.id === product.id);
  if (index === -1) {
    if (cart.lines.length >= MAX_CART_LINES) return cart;
    return { lines: [...cart.lines, { product, quantity: clampQuantity(quantity, product) }] };
  }
  const lines = cart.lines.slice();
  lines[index] = { product, quantity: clampQuantity(lines[index].quantity + Math.max(0, quantity), product) };
  return { lines };
};

/** Set a line's quantity; 0 or less removes it. Unknown ids are ignored. */
export const setLineQuantity = (cart: Cart, productId: string, quantity: number): Cart => {
  const line = cart.lines.find((l) => l.product.id === productId);
  if (!line) return cart;
  if (!(quantity > 0)) return removeLine(cart, productId);
  const next = clampQuantity(quantity, line.product);
  if (next === 0) return removeLine(cart, productId);
  return { lines: cart.lines.map((l) => (l.product.id === productId ? { ...l, quantity: next } : l)) };
};

export const removeLine = (cart: Cart, productId: string): Cart => ({
  lines: cart.lines.filter((l) => l.product.id !== productId),
});

export const lineTotal = (line: CartLine): Money => Money.multiply(line.product.unitPrice, line.quantity);

export const cartTotals = (cart: Cart): CartTotals => {
  let itemCount = 0;
  let subtotal = Money.zero();
  let regular = Money.zero();
  for (const line of cart.lines) {
    itemCount += line.quantity;
    subtotal = Money.add(subtotal, lineTotal(line));
    // A "regular" price below the sale price is bad data; count no saving for it.
    const before = line.product.regularUnitPrice;
    const unit = before && before.amount > line.product.unitPrice.amount ? before : line.product.unitPrice;
    regular = Money.add(regular, Money.multiply(unit, line.quantity));
  }
  return { itemCount, subtotal, savings: Money.subtract(regular, subtotal) };
};
