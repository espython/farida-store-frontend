import { describe, expect, it } from "vitest";
import { Money } from "@/shared/kernel/Money";
import { normaliseCouponCode, previewCoupon, type Coupon } from "./coupon";

const now = new Date("2026-10-31T12:00:00Z");
const coupon = (extra: Partial<Coupon> = {}): Coupon => ({
  code: "save10",
  kind: "percent",
  value: 10,
  active: true,
  expiresAt: null,
  minSubtotal: null,
  maxUses: null,
  usesCount: 0,
  ...extra,
});
const subtotal = Money.of(100_000);
const discountOf = (c: Coupon, method: "cod" | "card" = "cod", total = subtotal) => {
  const r = previewCoupon(c, total, method, now);
  return r.ok ? r.discount.amount : r.reason;
};

describe("normaliseCouponCode", () => {
  it("trims, upper-cases and rejects anything outside the code alphabet", () => {
    expect(normaliseCouponCode(" save-10 ")).toBe("SAVE-10");
    expect(normaliseCouponCode("")).toBeNull();
    expect(normaliseCouponCode("a".repeat(65))).toBeNull();
    expect(normaliseCouponCode("SAVE 10")).toBeNull();
    expect(normaliseCouponCode(10)).toBeNull();
  });
});

describe("previewCoupon", () => {
  it("applies a percent coupon and reports the new total", () => {
    const r = previewCoupon(coupon(), subtotal, "cod", now);
    expect(r).toEqual({ ok: true, code: "SAVE10", discount: Money.of(10_000), total: Money.of(90_000) });
  });

  it("clamps percent to 0–100 and caps fixed amounts at the subtotal", () => {
    expect(discountOf(coupon({ value: 150 }))).toBe(100_000);
    expect(discountOf(coupon({ value: -20 }))).toBe(0);
    expect(discountOf(coupon({ value: NaN }))).toBe(0);
    expect(discountOf(coupon({ kind: "fixed", value: 25_000 }))).toBe(25_000);
    expect(discountOf(coupon({ kind: "fixed", value: 500_000 }))).toBe(100_000);
    expect(discountOf(coupon({ kind: "fixed", value: -5 }))).toBe(0);
  });

  it("rounds percent discounts half up to whole piastres", () => {
    expect(discountOf(coupon({ value: 15 }), "cod", Money.of(333))).toBe(50); // 49.95 → 50
  });

  it("refuses inactive, expired, below-minimum and used-up coupons with one reason", () => {
    expect(discountOf(coupon({ active: false }))).toBe("invalid");
    expect(discountOf(coupon({ expiresAt: "2026-10-31T11:59:59Z" }))).toBe("invalid");
    expect(discountOf(coupon({ expiresAt: "not a date" }))).toBe("invalid");
    expect(discountOf(coupon({ minSubtotal: Money.of(100_001) }))).toBe("invalid");
    expect(discountOf(coupon({ maxUses: 5, usesCount: 5 }))).toBe("invalid");
    expect(previewCoupon(null, subtotal, "cod", now)).toEqual({ ok: false, reason: "invalid" });
  });

  it("accepts a coupon that expires later and one exactly at the minimum", () => {
    expect(discountOf(coupon({ expiresAt: "2026-11-01T00:00:00Z", minSubtotal: subtotal }))).toBe(10_000);
  });

  it("refuses a free order paid by card but allows it cash on delivery", () => {
    const all = coupon({ value: 100 });
    expect(discountOf(all, "card")).toBe("zero_total_card");
    expect(discountOf(all, "cod")).toBe(100_000);
  });
});
