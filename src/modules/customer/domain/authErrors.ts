/** Why a sign-in or registration failed, in the storefront's own words. */
export type AuthErrorCode =
  /** Unknown email or wrong password: one code on purpose, so accounts cannot be probed. */
  | "invalid_credentials"
  | "email_taken"
  | "invalid_input"
  /** Missing, expired or rejected session token. */
  | "unauthenticated"
  /** A password reset link that is malformed, used or older than an hour. */
  | "invalid_reset_link"
  /** An email confirmation link that is malformed, expired or for an email that changed. */
  | "invalid_verify_link";

export const AUTH_ERROR_STATUS: Record<AuthErrorCode, number> = {
  invalid_credentials: 401,
  email_taken: 409,
  invalid_input: 400,
  unauthenticated: 401,
  invalid_reset_link: 400,
  invalid_verify_link: 400,
};
