import { emptyCart, type Cart } from "../domain/cart";
import { toCart, toStoredCart } from "./storedCartMapper";

/**
 * Guest cart in localStorage, separate from the legacy MobX cart's
 * sessionStorage "cart" so both can run side by side until cutover.
 */
export const CART_STORAGE_KEY = "farida:cart:v1";

// Storage can be missing (server render) or throw (private mode, blocked
// site data, quota). The cart then simply lives in memory for the visit.
const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export const loadCart = (): Cart => {
  try {
    const text = storage()?.getItem(CART_STORAGE_KEY);
    return text ? toCart(JSON.parse(text)) : emptyCart();
  } catch {
    return emptyCart();
  }
};

export const saveCart = (cart: Cart): void => {
  try {
    const s = storage();
    if (!s) return;
    if (cart.lines.length === 0) s.removeItem(CART_STORAGE_KEY);
    else s.setItem(CART_STORAGE_KEY, JSON.stringify(toStoredCart(cart)));
  } catch {
    // Quota or blocked storage: keep the in-memory cart.
  }
};
