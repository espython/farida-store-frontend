/**
 * One idempotency key per checkout intent. The key is reused for retries of
 * the same intent (reload, lost response, double click) and replaced when
 * what is being bought changes, so a genuinely new order is never folded into
 * the previous one. Pure: storage is an infrastructure concern.
 */
export interface CheckoutIntent {
  customerId: string;
  items: { id: string; quantity: number }[];
  /** Governorate + street is enough to tell two deliveries apart. */
  addressKey: string;
  paymentMethod: string;
}

/** Items sorted, so reordering the cart is not a different intent. */
export const fingerprintOf = (i: CheckoutIntent): string =>
  [i.customerId, i.paymentMethod, i.addressKey, i.items.map((x) => `${x.id}:${x.quantity}`).sort().join(",")].join("|");

export const mintKey = (customerId: string, random: () => string): string => `${customerId}_${random()}`;

/** The stored key if it belongs to this intent, otherwise a new one. */
export const keyFor = (
  intent: CheckoutIntent,
  stored: { fingerprint: string; key: string } | null,
  random: () => string
): { fingerprint: string; key: string } => {
  const fingerprint = fingerprintOf(intent);
  return stored && stored.fingerprint === fingerprint ? stored : { fingerprint, key: mintKey(intent.customerId, random) };
};

/** Shape accepted from clients: bounded, URL-safe. */
export const isIdempotencyKey = (k: unknown): k is string => typeof k === "string" && /^[A-Za-z0-9_.:-]{8,120}$/.test(k);
