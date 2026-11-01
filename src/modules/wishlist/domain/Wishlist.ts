/**
 * Products a shopper saved for later, newest first. Only ids: names, prices
 * and stock are read from the catalog when the list is shown, so they are
 * never stale.
 */
export interface Wishlist {
  productIds: string[];
}

/** The Store API returns at most this many products for one id list. */
export const MAX_WISHLIST = 50;

export const isProductId = (id: string) => /^[1-9]\d{0,9}$/.test(id);

export const emptyWishlist = (): Wishlist => ({ productIds: [] });

export const hasProduct = (w: Wishlist, id: string) => w.productIds.includes(id);

export const isFull = (w: Wishlist) => w.productIds.length >= MAX_WISHLIST;

export type SaveResult = { ok: true; wishlist: Wishlist } | { ok: false; error: "full" | "invalid" };

/** Save a product (newest first). Saving one already there changes nothing. */
export const saveProduct = (w: Wishlist, id: string): SaveResult => {
  if (!isProductId(id)) return { ok: false, error: "invalid" };
  if (hasProduct(w, id)) return { ok: true, wishlist: w };
  if (isFull(w)) return { ok: false, error: "full" };
  return { ok: true, wishlist: { productIds: [id, ...w.productIds] } };
};

export const removeProduct = (w: Wishlist, id: string): Wishlist => ({ productIds: w.productIds.filter((p) => p !== id) });

/**
 * A guest's list joins the customer's saved one after sign-in: guest items
 * not already saved go first, up to the limit; the rest are `skipped`.
 */
export const mergeWishlists = (saved: Wishlist, guest: Wishlist): { wishlist: Wishlist; added: number; skipped: number } => {
  const fresh = guest.productIds.filter((id, i, all) => isProductId(id) && all.indexOf(id) === i && !hasProduct(saved, id));
  const room = Math.max(0, MAX_WISHLIST - saved.productIds.length);
  const added = fresh.slice(0, room);
  return { wishlist: { productIds: [...added, ...saved.productIds] }, added: added.length, skipped: fresh.length - added.length };
};

/** Untrusted ids (storage, meta) → a valid wishlist: unique, well-formed, capped. */
export const toWishlist = (ids: unknown): Wishlist => {
  const list = Array.isArray(ids) ? ids.map(String) : [];
  return { productIds: list.filter((id, i) => isProductId(id) && list.indexOf(id) === i).slice(0, MAX_WISHLIST) };
};
