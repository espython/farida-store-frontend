import type { Money } from "@/shared/kernel/Money";
import type { CartLine } from "@/modules/cart";
import type { Address } from "./Address";

export type PaymentMethod = "cod" | "card";

export interface ShippingRate {
  id: string;
  name: string;
  price: Money;
  selected: boolean;
}

export interface AppliedCoupon {
  code: string;
  discount: Money;
}

/** Woo's own totals for the order being placed (authoritative). */
export interface CheckoutTotals {
  items: Money;
  shipping: Money;
  discount: Money;
  total: Money;
}

/**
 * What the customer is about to order: the saved cart plus the delivery
 * address, shipping choice, coupons and Woo's totals. A read model of the
 * Store API cart; Woo enforces every rule when the order is placed.
 */
export interface Checkout {
  lines: CartLine[];
  address: Address;
  shippingRates: ShippingRate[];
  coupons: AppliedCoupon[];
  /** Payment methods the shop currently offers, in its order. */
  paymentMethods: PaymentMethod[];
  totals: CheckoutTotals;
}

export const selectedRate = (c: Checkout): ShippingRate | null => c.shippingRates.find((r) => r.selected) ?? null;

/** Ready to place: items, a complete address and a chosen shipping rate. */
export const canPlaceOrder = (c: Checkout, addressComplete: boolean): boolean =>
  c.lines.length > 0 && addressComplete && selectedRate(c) !== null && c.paymentMethods.length > 0;

/** An order Woo accepted. */
export interface PlacedOrder {
  id: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  lines: { title: string; quantity: number; total: Money; image: string | null; slug: string | null }[];
  address: Address;
  note: string;
  totals: CheckoutTotals;
}
