import { emptyWishlist, toWishlist, type Wishlist } from "../domain/Wishlist";

/** A guest's wishlist in localStorage (the legacy store used "wishlist", with another shape). */
export const WISHLIST_STORAGE_KEY = "farida:wishlist:v1";

// Missing (server render) or throwing (private mode, blocked site data):
// the wishlist then lives in memory for the visit.
const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export const loadWishlist = (): Wishlist => {
  try {
    const text = storage()?.getItem(WISHLIST_STORAGE_KEY);
    return text ? toWishlist((JSON.parse(text) as { ids?: unknown }).ids) : emptyWishlist();
  } catch {
    return emptyWishlist();
  }
};

export const saveWishlist = (w: Wishlist): void => {
  try {
    const s = storage();
    if (!s) return;
    if (w.productIds.length === 0) s.removeItem(WISHLIST_STORAGE_KEY);
    else s.setItem(WISHLIST_STORAGE_KEY, JSON.stringify({ v: 1, ids: w.productIds }));
  } catch {
    // Quota or blocked storage: keep the in-memory list.
  }
};
