// Public API of the cart context (client-safe). UI uses useCart(); the slice
// actions are exported only so other contexts can react to them through
// listener middleware. The server cart (Store API, C2) will be exposed
// through ./index.server.

// Domain: types and read-only rules.
export type { Cart, CartLine, CartTotals, ProductRef } from "./domain/cart";
export { lineLimit, lineTotal, MAX_CART_LINES, MAX_LINE_QUANTITY } from "./domain/cart";
export { normaliseCouponCode, previewCoupon, MAX_COUPON_CODE_LENGTH } from "./domain/coupon";
export type { Coupon, CouponPreview, PaymentMethod } from "./domain/coupon";

// Application: use cases, selectors, store wiring.
export { useCart } from "./application/useCart";
export type { UseCart } from "./application/useCart";
export { toProductRef } from "./application/productRef";
export {
  selectCart,
  selectCartCount,
  selectCartHydrated,
  selectCartLine,
  selectCartLines,
  selectCartTotals,
} from "./application/selectors";
export { CART_KEY, cartActions, cartReducer, initialCartState } from "./application/cartSlice";
export type { CartState } from "./application/cartSlice";
export { startCartPersistence, useCartPersistence } from "./application/cartPersistence";
