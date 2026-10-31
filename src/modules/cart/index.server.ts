// Server entry of the cart context. Import only from app/api and server components.
export { addItem, clearCart, getCart, mergeLines, removeItem, setQuantity } from "./infrastructure/cartClient.server";
export type { CartCaller, CartResult, MergeResult } from "./infrastructure/cartClient.server";
export { CART_TOKEN_COOKIE, clearCartToken, readCartToken, setCartToken } from "./infrastructure/cartTokenCookie.server";
export { MAX_CART_LINES, MAX_LINE_QUANTITY } from "./domain/cart";
