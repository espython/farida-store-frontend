import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearCheckoutIdempotencyKey,
  getCheckoutIdempotencyKey,
  type CheckoutIntent,
} from "./checkoutIdempotency";

const intent: CheckoutIntent = {
  userId: 7,
  items: [
    { id: 1, quantity: 2 },
    { id: 2, quantity: 1 },
  ],
  addressId: 10,
  paymentMethod: "card",
};

afterEach(() => vi.restoreAllMocks());

describe("checkout idempotency key", () => {
  it("is prefixed with the user id", () => {
    expect(getCheckoutIdempotencyKey(intent)).toMatch(/^7_/);
  });

  it("is reused for the same intent (reload or retry)", () => {
    expect(getCheckoutIdempotencyKey(intent)).toBe(
      getCheckoutIdempotencyKey({ ...intent })
    );
  });

  it("ignores cart item order", () => {
    const first = getCheckoutIdempotencyKey(intent);
    const reordered = { ...intent, items: [...intent.items].reverse() };
    expect(getCheckoutIdempotencyKey(reordered)).toBe(first);
  });

  it.each([
    ["quantity", { items: [{ id: 1, quantity: 3 }, { id: 2, quantity: 1 }] }],
    ["address", { addressId: 11 }],
    ["payment method", { paymentMethod: "cod" as const }],
  ])("changes when the %s changes", (_label, change) => {
    const first = getCheckoutIdempotencyKey(intent);
    expect(getCheckoutIdempotencyKey({ ...intent, ...change })).not.toBe(first);
  });

  it("mints a new key after it is cleared", () => {
    const first = getCheckoutIdempotencyKey(intent);
    clearCheckoutIdempotencyKey();
    expect(getCheckoutIdempotencyKey(intent)).not.toBe(first);
  });

  it("still returns a key when sessionStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getCheckoutIdempotencyKey(intent)).toMatch(/^7_/);
  });
});
