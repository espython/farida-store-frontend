import { describe, expect, it } from "vitest";
import { clientIp, fixedWindowLimiter } from "./rateLimit.server";

describe("fixedWindowLimiter", () => {
  it("allows `max` per key per window, then refuses until the window passes", () => {
    const limited = fixedWindowLimiter({ windowMs: 1000, max: 2 });
    expect([limited("a", 0), limited("a", 10), limited("a", 20)]).toEqual([false, false, true]);
    expect(limited("b", 20)).toBe(false);
    expect(limited("a", 1000)).toBe(false);
  });

  it("refuses new keys beyond maxKeys instead of growing", () => {
    const limited = fixedWindowLimiter({ windowMs: 1000, max: 5, maxKeys: 2 });
    expect([limited("a", 0), limited("b", 0), limited("c", 0)]).toEqual([false, false, true]);
    expect(limited("c", 1000)).toBe(false); // swept after the window
  });
});

it("clientIp takes the first forwarded address", () => {
  expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
  expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
  expect(clientIp(new Headers())).toBe("unknown");
});
