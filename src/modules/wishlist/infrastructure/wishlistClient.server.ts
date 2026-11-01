import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import { serializedPerKey } from "@/shared/infrastructure/perKeyQueue.server";
import { mergeWishlists, removeProduct, saveProduct, toWishlist, type Wishlist } from "../domain/Wishlist";

/** Customer meta key holding the saved ids (JSON). Not exposed by public WP routes (spike-account). */
export const WISHLIST_META_KEY = "farida_wishlist";

interface WcCustomerMeta {
  id: number;
  meta_data?: { key: string; value: unknown }[];
}

// Read and written with the server keys, so the id must be one WordPress
// verified (verifiedCaller in app/api); it is the only id used.
const requireCustomer = (customerId: string) => {
  if (!/^[1-9]\d*$/.test(customerId)) throw new AppError("unauthenticated", "Sign in to use your wishlist", 401);
};

const fromMeta = (dto: WcCustomerMeta): Wishlist => {
  const meta = (dto.meta_data ?? []).find((m) => m.key === WISHLIST_META_KEY);
  if (!meta) return { productIds: [] };
  try {
    const parsed = typeof meta.value === "string" ? JSON.parse(meta.value) : meta.value;
    return toWishlist((parsed as { ids?: unknown } | null)?.ids);
  } catch {
    return { productIds: [] };
  }
};

async function read(customerId: string): Promise<Wishlist> {
  requireCustomer(customerId);
  const { data } = await wooFetch<WcCustomerMeta>({
    path: `/wc/v3/customers/${customerId}`,
    auth: "keys",
    query: { _fields: "id,meta_data" },
  });
  return fromMeta(data);
}

async function write(customerId: string, w: Wishlist): Promise<Wishlist> {
  const { data } = await wooFetch<WcCustomerMeta>({
    method: "PUT",
    path: `/wc/v3/customers/${customerId}`,
    auth: "keys",
    query: { _fields: "id,meta_data" },
    body: { meta_data: [{ key: WISHLIST_META_KEY, value: JSON.stringify({ v: 1, ids: w.productIds }) }] },
  });
  return fromMeta(data);
}

/** Read-modify-write, one at a time per customer. */
const change = (customerId: string, decide: (w: Wishlist) => Wishlist | null) =>
  serializedPerKey(`wishlist:${customerId}`, async () => {
    const current = await read(customerId);
    const next = decide(current);
    return next ? write(customerId, next) : current;
  });

/** A product the shop sells (and shows): saving anything else is a 404. */
async function requireProduct(productId: string) {
  await wooFetch({
    path: `/wc/store/v1/products/${productId}`,
    query: { _fields: "id" },
    next: { revalidate: 300, tags: ["catalog"] },
    mapError: (status) => (status === 404 ? new AppError("not_found", "No such product", 404) : undefined),
  });
}

export const getWishlist = (customerId: string) => read(customerId);

export async function addToWishlist(customerId: string, productId: string): Promise<Wishlist> {
  requireCustomer(customerId);
  await requireProduct(productId);
  return change(customerId, (w) => {
    const r = saveProduct(w, productId);
    if (!r.ok) throw r.error === "full" ? new AppError("wishlist_full", "The wishlist is full", 409) : new AppError("not_found", "No such product", 404);
    return r.wishlist === w ? null : r.wishlist;
  });
}

export const removeFromWishlist = (customerId: string, productId: string) =>
  change(customerId, (w) => (w.productIds.includes(productId) ? removeProduct(w, productId) : null));

/** Move a guest's list into the saved one (after sign-in). */
export async function mergeIntoWishlist(customerId: string, guestIds: string[]): Promise<{ wishlist: Wishlist; skipped: number }> {
  let skipped = 0;
  const wishlist = await change(customerId, (w) => {
    const r = mergeWishlists(w, toWishlist(guestIds));
    skipped = r.skipped;
    return r.added > 0 ? r.wishlist : null;
  });
  return { wishlist, skipped };
}
