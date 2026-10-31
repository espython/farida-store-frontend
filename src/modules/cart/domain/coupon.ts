import { Money } from "@/shared/kernel/Money";

/**
 * Client-side coupon preview, ported from the old backend's evaluateCoupon
 * (backend-admin/src/utils/coupons.ts). Woo applies the coupon for real at
 * checkout; this only lets the cart show what a known coupon would take off.
 */

export const MAX_COUPON_CODE_LENGTH = 64;
const COUPON_CODE_PATTERN = /^[A-Z0-9_-]+$/;

export interface Coupon {
  code: string;
  kind: "percent" | "fixed";
  /** Percent (0–100) for "percent"; minor units for "fixed". */
  value: number;
  active: boolean;
  /** ISO date-time, or null for no expiry. */
  expiresAt: string | null;
  minSubtotal: Money | null;
  maxUses: number | null;
  usesCount: number;
}

export type PaymentMethod = "cod" | "card";

export type CouponPreview =
  | { ok: true; code: string; discount: Money; total: Money }
  /** One reason for every unusable code, so the UI cannot tell "unknown" from "expired". */
  | { ok: false; reason: "invalid" | "zero_total_card" };

/** Trimmed and upper-cased; null when empty, too long or containing other characters. */
export const normaliseCouponCode = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  if (code.length === 0 || code.length > MAX_COUPON_CODE_LENGTH) return null;
  return COUPON_CODE_PATTERN.test(code) ? code : null;
};

/**
 * What the coupon takes off `subtotal` (after sale prices; coupons apply on
 * top, never compounded per line). Percent is clamped to 0–100, a fixed amount
 * is capped at the subtotal, an unparseable expiry counts as expired, and a
 * card payment of 0 is refused because Paymob cannot process it.
 */
export const previewCoupon = (
  coupon: Coupon | null,
  subtotal: Money,
  method: PaymentMethod,
  now: Date = new Date()
): CouponPreview => {
  if (!coupon || !coupon.active) return { ok: false, reason: "invalid" };

  if (coupon.expiresAt !== null) {
    const expires = Date.parse(coupon.expiresAt);
    if (!Number.isFinite(expires) || expires <= now.getTime()) return { ok: false, reason: "invalid" };
  }
  if (coupon.minSubtotal && subtotal.amount < coupon.minSubtotal.amount) return { ok: false, reason: "invalid" };
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) return { ok: false, reason: "invalid" };

  const base = Math.max(0, subtotal.amount);
  const value = Number.isFinite(coupon.value) ? coupon.value : 0;
  const raw =
    coupon.kind === "percent"
      ? base - Money.percentOff(Money.of(base, subtotal.currency), value).amount
      : Math.max(0, Math.round(value));
  const discount = Money.of(Math.min(raw, base), subtotal.currency);

  if (method === "card" && discount.amount >= base) return { ok: false, reason: "zero_total_card" };

  return {
    ok: true,
    code: normaliseCouponCode(coupon.code) ?? coupon.code,
    discount,
    total: Money.subtract(Money.of(base, subtotal.currency), discount),
  };
};
