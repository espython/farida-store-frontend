import type { Order } from "./Order";

// Return requests: a customer asks to return a delivered order within the
// return window; the shop then refunds or declines it in Woo.
// Pure domain: no React, Redux, Next or Woo.

/** Days after delivery a return can be requested (Egyptian consumer law: 14). */
export const RETURN_WINDOW_DAYS = 14;
export const MAX_RETURN_DETAILS_LENGTH = 1000;
export const MIN_OTHER_DETAILS_LENGTH = 10;

export const RETURN_REASONS = ["damaged", "wrong_item", "not_as_described", "changed_mind", "other"] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export interface ReturnRequest {
  reason: ReturnReason;
  /** What is wrong and which items; required when the reason is "other". */
  details: string;
}

export type ReturnRequestError = "reason_required" | "details_required" | "details_too_long";
export type ReturnRequestErrors = Partial<Record<keyof ReturnRequest, ReturnRequestError>>;
export type ReturnRequestResult = { ok: true; request: ReturnRequest } | { ok: false; errors: ReturnRequestErrors };

const DAY_MS = 24 * 60 * 60 * 1000;

/** The last moment a return can be requested, or null when the order was never delivered. */
export const returnDeadline = (order: Pick<Order, "status" | "deliveredAt">): Date | null => {
  if (order.status !== "delivered" || !order.deliveredAt) return null;
  const delivered = Date.parse(order.deliveredAt);
  return Number.isFinite(delivered) ? new Date(delivered + RETURN_WINDOW_DAYS * DAY_MS) : null;
};

/** Delivered, and delivered no more than RETURN_WINDOW_DAYS ago. */
export const canRequestReturn = (order: Pick<Order, "status" | "deliveredAt">, now: Date = new Date()): boolean => {
  const deadline = returnDeadline(order);
  return deadline !== null && now.getTime() <= deadline.getTime();
};

const isReason = (value: unknown): value is ReturnReason => (RETURN_REASONS as readonly unknown[]).includes(value);

/** Trimmed, line endings unified, runs of blank lines collapsed. */
export const cleanReturnDetails = (text: string): string =>
  text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** A reason from the list; details up to 1000 characters, at least 10 when the reason is "other". */
export function validateReturnRequest(input: { reason: unknown; details: unknown }): ReturnRequestResult {
  const errors: ReturnRequestErrors = {};
  if (!isReason(input.reason)) errors.reason = "reason_required";
  const details = cleanReturnDetails(typeof input.details === "string" ? input.details : "");
  const length = Array.from(details).length;
  if (length > MAX_RETURN_DETAILS_LENGTH) errors.details = "details_too_long";
  else if (input.reason === "other" && length < MIN_OTHER_DETAILS_LENGTH) errors.details = "details_required";
  if (errors.reason || errors.details) return { ok: false, errors };
  return { ok: true, request: { reason: input.reason as ReturnReason, details } };
}
