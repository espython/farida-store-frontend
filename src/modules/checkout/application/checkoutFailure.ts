import type { AddressError } from "@/shared/kernel/Address";

/** What the checkout UI tells the shopper. */
export type CheckoutFailureCode =
  | "invalid_address"
  | "coupon_invalid"
  | "out_of_stock"
  | "cart_empty"
  | "payment_unavailable"
  | "unavailable";

export interface CheckoutFailure {
  code: CheckoutFailureCode;
  fields: Partial<Record<string, AddressError>>;
}

/** BFF error body → a failure the UI can name. Woo's stock codes all become out_of_stock. */
export const toCheckoutFailure = (error: unknown): CheckoutFailure => {
  const e = (error as { data?: { error?: { code?: string; details?: unknown } } })?.data?.error;
  const code = e?.code ?? "";
  const fields = e?.details && typeof e.details === "object" && !Array.isArray(e.details) ? (e.details as CheckoutFailure["fields"]) : {};
  if (code === "invalid_address") return { code, fields };
  if (code === "coupon_invalid" || code === "payment_unavailable" || code === "cart_empty") return { code, fields: {} };
  if (code.includes("out_of_stock")) return { code: "out_of_stock", fields: {} };
  return { code: "unavailable", fields: {} };
};
