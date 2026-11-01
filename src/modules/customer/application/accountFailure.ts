import type { AddressError } from "@/shared/kernel/Address";
import type { ProfileError } from "../domain/Profile";

/** What the account pages tell the customer. */
export type AccountFailureCode = "invalid" | "book_full" | "not_found" | "unavailable";

export interface AccountFailure {
  code: AccountFailureCode;
  /** Field → rule code, from the BFF's validation (same rules as the forms). */
  fields: Partial<Record<string, AddressError | ProfileError>>;
}

export type AccountResult = { ok: true } | { ok: false; failure: AccountFailure };

/** BFF error body → a failure the UI can name. */
export const toAccountFailure = (error: unknown): AccountFailure => {
  const e = (error as { data?: { error?: { code?: string; details?: unknown } } })?.data?.error;
  const code = e?.code ?? "";
  const details = e?.details && typeof e.details === "object" && !Array.isArray(e.details) ? (e.details as AccountFailure["fields"]) : {};
  if (code === "invalid_address" || code === "invalid_profile") return { code: "invalid", fields: details };
  if (code === "address_book_full") return { code: "book_full", fields: {} };
  if (code === "not_found") return { code: "not_found", fields: {} };
  return { code: "unavailable", fields: {} };
};
