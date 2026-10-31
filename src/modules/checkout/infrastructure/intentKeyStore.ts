import type { CheckoutIntent } from "../domain/idempotency";
import { keyFor } from "../domain/idempotency";

/**
 * Keeps the idempotency key of the checkout in progress for this tab
 * (sessionStorage), so a reload or a lost response retries the same order
 * instead of placing another. Client-side only.
 */
const STORAGE_KEY = "farida:checkout:intent";

const random = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

export const intentKey = (intent: CheckoutIntent): string => {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as { fingerprint: string; key: string }) : null;
    const next = keyFor(intent, stored && typeof stored.key === "string" ? stored : null, random);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next.key;
  } catch {
    // Storage blocked: still dedupes double clicks within this request burst.
    return keyFor(intent, null, random).key;
  }
};

/** After the order is confirmed: the next checkout is a new intent. */
export const clearIntentKey = () => {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
