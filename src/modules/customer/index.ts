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

// Application: auth API slice (store wiring), session and sign-in use cases.
export { AUTH_API_KEY, authApi } from "./application/authApi";
export { useSession } from "./application/useSession";
export type { SessionStatus } from "./application/useSession";
export { useAuthActions } from "./application/useAuthActions";
export type { AuthFailure } from "./application/authFailure";

// UI
export { default as SignInForm } from "./ui/SignInForm";
export { default as RegisterForm } from "./ui/RegisterForm";
export { default as AccountMenu } from "./ui/AccountMenu";
