import { describe, expect, it } from "vitest";
import { getPriceAfterDiscount } from "./getPriceAfterDiscount";

describe("getPriceAfterDiscount", () => {
  it("applies a percentage discount", () => {
    expect(getPriceAfterDiscount(20, 500)).toBe(400);
  });

  it("rounds to two decimals", () => {
    expect(getPriceAfterDiscount(15, 99.99)).toBe(84.99);
  });

  it("returns the current price when there is no discount", () => {
    expect(getPriceAfterDiscount(0, 250)).toBe(250);
  });

  it("ignores a negative discount", () => {
    expect(getPriceAfterDiscount(-10, 250)).toBe(250);
  });

  it("gives a free item at 100%", () => {
    expect(getPriceAfterDiscount(100, 250)).toBe(0);
  });
});
