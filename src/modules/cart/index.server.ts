// Server entry of the cart context. Import only from app/api and server components.
export { addItem, clearCart, getCart, mergeLines, removeItem, setQuantity } from "./infrastructure/cartClient.server";
export type { CartCaller, CartResult, MergeResult } from "./infrastructure/cartClient.server";
export { CART_TOKEN_COOKIE, clearCartToken, readCartToken, setCartToken } from "./infrastructure/cartTokenCookie.server";
export { MAX_CART_LINES, MAX_LINE_QUANTITY } from "./domain/cart";

// For contexts that read the Store API cart themselves (checkout): the cart owns the line mapping.
export { toCart as cartFromStoreApi } from "./infrastructure/storeCartMapper";
export type { StoreCart } from "./infrastructure/storeCartDto";
export { normaliseCouponCode, MAX_COUPON_CODE_LENGTH } from "./domain/coupon";
