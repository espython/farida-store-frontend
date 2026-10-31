import { describe, expect, it } from "vitest";
import { formatAmount } from "./price";

describe("formatAmount", () => {
  it("groups thousands and drops zero piastres", () => {
    expect(formatAmount(3490)).toBe("3,490");
    expect(formatAmount("15900.00")).toBe("15,900");
    expect(formatAmount(349.5)).toBe("349.50");
    expect(formatAmount(0.1 + 0.2)).toBe("0.30");
  });
  it("passes through what it cannot parse", () => {
    expect(formatAmount("n/a")).toBe("n/a");
    expect(formatAmount(undefined)).toBe("");
  });
});
