import { describe, expect, it } from "vitest";
import { canCancel } from "./cancellation";
import type { OrderPayment, OrderStatus } from "./Order";
import { canRequestReturn, cleanReturnDetails, returnDeadline, validateReturnRequest } from "./ReturnRequest";

describe("canCancel", () => {
  const cases: [OrderStatus, OrderPayment, boolean][] = [
    ["awaiting_payment", "card", true],
    ["failed", "card", true],
    ["placed", "cod", true],
    ["placed", "card", false],
    ["placed", "other", false],
    ["out_for_delivery", "cod", false],
    ["delivered", "cod", false],
    ["return_requested", "cod", false],
    ["cancelled", "cod", false],
    ["refunded", "cod", false],
  ];
  it.each(cases)("%s paid by %s → %s", (status, payment, expected) => {
    expect(canCancel({ status, payment })).toBe(expected);
  });
});

describe("return window", () => {
  const delivered = { status: "delivered" as const, deliveredAt: "2026-11-01T10:00:00Z" };
  it("is 14 days from delivery", () => {
    expect(returnDeadline(delivered)?.toISOString()).toBe("2026-11-15T10:00:00.000Z");
    expect(canRequestReturn(delivered, new Date("2026-11-15T10:00:00Z"))).toBe(true);
    expect(canRequestReturn(delivered, new Date("2026-11-15T10:00:01Z"))).toBe(false);
  });
  it("needs a delivered order with a date", () => {
    expect(canRequestReturn({ status: "placed", deliveredAt: null }, new Date("2026-11-02"))).toBe(false);
    expect(canRequestReturn({ status: "delivered", deliveredAt: null }, new Date("2026-11-02"))).toBe(false);
    expect(canRequestReturn({ status: "delivered", deliveredAt: "nonsense" }, new Date("2026-11-02"))).toBe(false);
    expect(canRequestReturn({ status: "return_requested", deliveredAt: "2026-11-01T10:00:00Z" }, new Date("2026-11-02"))).toBe(false);
  });
});

describe("validateReturnRequest", () => {
  it("accepts a listed reason with optional details", () => {
    expect(validateReturnRequest({ reason: "damaged", details: "" })).toEqual({ ok: true, request: { reason: "damaged", details: "" } });
    expect(validateReturnRequest({ reason: "wrong_item", details: "  The blue kettle  \r\n\r\n\r\n\r\nnot red " })).toEqual({
      ok: true,
      request: { reason: "wrong_item", details: "The blue kettle\n\nnot red" },
    });
  });
  it("refuses an unknown reason and long details", () => {
    expect(validateReturnRequest({ reason: "bored", details: "" })).toEqual({ ok: false, errors: { reason: "reason_required" } });
    expect(validateReturnRequest({ reason: 3, details: undefined })).toEqual({ ok: false, errors: { reason: "reason_required" } });
    expect(validateReturnRequest({ reason: "damaged", details: "x".repeat(1001) })).toEqual({ ok: false, errors: { details: "details_too_long" } });
  });
  it("needs details for 'other'", () => {
    expect(validateReturnRequest({ reason: "other", details: "too short" })).toEqual({ ok: false, errors: { details: "details_required" } });
    expect(validateReturnRequest({ reason: "other", details: "The lid does not fit" }).ok).toBe(true);
  });
  it("counts characters, not UTF-16 units", () => {
    expect(validateReturnRequest({ reason: "other", details: "مكسور تمامًا" }).ok).toBe(true);
    expect(cleanReturnDetails("a\t \nb")).toBe("a\nb");
  });
});
