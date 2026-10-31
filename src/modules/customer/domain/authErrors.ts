/** Why a sign-in or registration failed, in the storefront's own words. */
export type AuthErrorCode =
  /** Unknown email or wrong password: one code on purpose, so accounts cannot be probed. */
  | "invalid_credentials"
  | "email_taken"
  | "invalid_input"
  /** Missing, expired or rejected session token. */
  | "unauthenticated";

export const AUTH_ERROR_STATUS: Record<AuthErrorCode, number> = {
  invalid_credentials: 401,
  email_taken: 409,
  invalid_input: 400,
  unauthenticated: 401,
};
