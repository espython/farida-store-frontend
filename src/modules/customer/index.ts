// Public API of the customer context (client-safe: domain types and rules).
// Server code (WordPress JWT, Woo customers, session cookies) is exposed
// through ./index.server for app/api only.
export type { Session } from "./domain/Session";
export { isSessionExpired, secondsUntilExpiry } from "./domain/Session";
export {
  emailError,
  normaliseEmail,
  passwordError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateLogin,
  validateRegistration,
} from "./domain/credentials";
export type { CredentialError, FieldErrors, RegistrationInput } from "./domain/credentials";
export type { AuthErrorCode } from "./domain/authErrors";
