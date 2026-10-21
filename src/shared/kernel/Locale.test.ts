import { describe, expect, it } from "vitest";
import { directionOf, isLocale } from "./Locale";

describe("Locale", () => {
  it("recognises supported locales only", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("maps Arabic to rtl", () => {
    expect(directionOf("ar")).toBe("rtl");
    expect(directionOf("en")).toBe("ltr");
  });
});
