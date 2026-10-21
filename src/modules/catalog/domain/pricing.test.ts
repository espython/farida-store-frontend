import { describe, expect, it } from "vitest";
import { Money } from "@/shared/kernel/Money";
import { discountPercent, isOnSale } from "./pricing";

describe("pricing", () => {
  it("computes the badge percentage from regular and current price", () => {
    const p = { price: Money.fromDecimal("720.00"), regularPrice: Money.fromDecimal("800.00") };
    expect(discountPercent(p)).toBe(10);
    expect(isOnSale(p)).toBe(true);
  });

  it("is 0 when not on sale or the data is odd", () => {
    expect(discountPercent({ price: Money.of(500), regularPrice: null })).toBe(0);
    expect(discountPercent({ price: Money.of(900), regularPrice: Money.of(800) })).toBe(0);
    expect(discountPercent({ price: Money.of(0), regularPrice: Money.of(0) })).toBe(0);
  });
});
