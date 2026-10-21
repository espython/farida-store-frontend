import { describe, expect, it } from "vitest";
import { Money } from "./Money";

describe("Money", () => {
  it("converts decimal strings to minor units without float errors", () => {
    expect(Money.fromDecimal("800.00").amount).toBe(80000);
    expect(Money.fromDecimal("349.5").amount).toBe(34950);
    expect(Money.fromDecimal("0.29").amount).toBe(29);
    expect(Money.fromDecimal("19.99").amount).toBe(1999);
    expect(Money.fromDecimal("5").amount).toBe(500);
    expect(Money.fromDecimal(12.1).amount).toBe(1210);
  });

  it("rounds extra fraction digits half up and keeps negatives", () => {
    expect(Money.fromDecimal("1.005").amount).toBe(101);
    expect(Money.fromDecimal("1.004").amount).toBe(100);
    expect(Money.fromDecimal("-2.50").amount).toBe(-250);
  });

  it("rejects malformed values", () => {
    for (const bad of ["", "abc", "1,5", "1.2.3", "12px"]) {
      expect(() => Money.fromDecimal(bad)).toThrow(/Invalid money/);
    }
    expect(() => Money.of(1.5)).toThrow();
    expect(() => Money.fromMinorUnits("")).toThrow();
  });

  it("round-trips through toDecimal", () => {
    for (const s of ["800.00", "0.05", "349.50", "-2.50"]) {
      expect(Money.toDecimal(Money.fromDecimal(s))).toBe(s);
    }
  });

  it("parses Store API minor-unit strings", () => {
    expect(Money.fromMinorUnits("80000")).toEqual({ amount: 80000, currency: "EGP" });
  });

  it("adds, subtracts and multiplies in integers", () => {
    const a = Money.fromDecimal("10.10");
    const b = Money.fromDecimal("0.20");
    expect(Money.add(a, b).amount).toBe(1030);
    expect(Money.subtract(a, b).amount).toBe(990);
    expect(Money.multiply(a, 3).amount).toBe(3030);
    expect(Money.equals(Money.zero(), Money.of(0))).toBe(true);
  });

  it("applies percentage discounts (spike: 800 - 10% = 720) and clamps", () => {
    const price = Money.fromDecimal("800.00");
    expect(Money.percentOff(price, 10).amount).toBe(72000);
    expect(Money.percentOff(price, 150).amount).toBe(0);
    expect(Money.percentOff(price, -5).amount).toBe(80000);
    expect(Money.percentOff(Money.of(1999), 15).amount).toBe(1699);
  });
});
