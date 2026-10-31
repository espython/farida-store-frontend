import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type { AuthErrorCode } from "../domain/authErrors";
import type { CredentialError } from "../domain/credentials";

export interface AuthFailure {
  /** What to tell the shopper; "unavailable" covers outages and network errors. */
  code: AuthErrorCode | "unavailable";
  /** Per-field codes from the domain rules (400 invalid_input). */
  fields: Partial<Record<string, CredentialError>>;
}

const KNOWN: AuthErrorCode[] = ["invalid_credentials", "email_taken", "invalid_input", "unauthenticated"];

/** BFF error body ({ error: { code, details } }) → a domain failure the forms can show. */
export const toAuthFailure = (error: FetchBaseQueryError | SerializedError | undefined): AuthFailure => {
  const data = (error && "data" in error ? error.data : undefined) as
    | { error?: { code?: string; details?: unknown } }
    | undefined;
  const code = data?.error?.code;
  const details = data?.error?.details;
  return {
    code: KNOWN.includes(code as AuthErrorCode) ? (code as AuthErrorCode) : "unavailable",
    fields: details && typeof details === "object" && !Array.isArray(details) ? (details as AuthFailure["fields"]) : {},
  };
};
