/**
 * Stable idempotency keys for server-owned checkout.
 *
 * The backend dedupes orders on a namespaced idempotency_key
 * ("<userId>:<key>", UNIQUE column), but a key that is minted per click
 * defeats that entirely: a reload, a lost response or a plain retry of the
 * same intent each arrive with a fresh key and create yet another order. So
 * the key is persisted for the life of one checkout intent and reused until
 * that intent resolves.
 *
 * sessionStorage rather than localStorage or component state, because the card
 * flow leaves the page entirely (Paymob iframe, then a full-page redirect back
 * to /payment-callback) and a reload must still resume the same order. It is
 * scoped to the tab, so it never leaks across browsers, and the stored key
 * carries no personal data.
 */

const STORAGE_KEY = "checkoutIdempotencyKey";

export interface CheckoutIntent {
  userId: string | number;
  items: Array<{ id: string | number; quantity: number }>;
  addressId: string | number;
  paymentMethod: "card" | "cod";
}

// Any change to *what* is being bought must invalidate the stored key.
// Otherwise a second, genuinely new order (same items, same address) would be
// deduped into the first one and never created at all. Items are sorted so
// that reordering the cart does not count as a different intent.
const fingerprintOf = ({
  userId,
  items,
  addressId,
  paymentMethod,
}: CheckoutIntent): string =>
  [
    String(userId),
    paymentMethod,
    String(addressId),
    items.map((item) => `${item.id}:${item.quantity}`).sort().join(","),
  ].join("|");

const mintKey = (userId: string | number): string => {
  const unique =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${userId}_${unique}`;
};

/**
 * Returns the key for this checkout intent, minting and storing a new one only
 * when the intent differs from the one already in progress.
 */
export const getCheckoutIdempotencyKey = (intent: CheckoutIntent): string => {
  const fingerprint = fingerprintOf(intent);

  if (typeof window === "undefined") {
    return mintKey(intent.userId);
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as {
        fingerprint?: string;
        key?: string;
      };
      if (stored.key && stored.fingerprint === fingerprint) {
        return stored.key;
      }
    }

    const key = mintKey(intent.userId);
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fingerprint, key })
    );
    return key;
  } catch {
    // sessionStorage throws when storage is disabled (private mode, blocked
    // third-party context). Never let that block checkout — an unminted key
    // degrades to the old per-click behaviour, which is still correct, just
    // not deduplicated.
    return mintKey(intent.userId);
  }
};

/**
 * Drops the stored key once an order is confirmed, so that ordering the same
 * products again later in the session creates a genuinely new order instead of
 * replaying the finished one. Deliberately NOT called on failure: a failed
 * checkout either rolled back (nothing to dedupe against) or lost its response
 * (and then the key is exactly what saves the retry).
 */
export const clearCheckoutIdempotencyKey = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
