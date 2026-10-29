import { createHmac, timingSafeEqual } from "crypto";

/**
 * Checks a WooCommerce webhook delivery: Woo sends
 * `X-WC-Webhook-Signature: base64(HMAC-SHA256(raw body, webhook secret))`.
 * The body must be the raw text as received, before any JSON parsing.
 */
export function isValidWooSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const given = Buffer.from(signature, "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Woo pings a new webhook's URL with an unsigned `webhook_id=<id>` form body. */
export const isWooPing = (rawBody: string) => /^webhook_id=\d+$/.test(rawBody.trim());
