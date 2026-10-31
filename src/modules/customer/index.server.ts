// Server entry of the customer context. Import only from app/api and server components.
export { getSession, login, register } from "./infrastructure/authClient.server";
export type { SignedIn } from "./infrastructure/authClient.server";
export {
  clearSessionCookies,
  FLAG_COOKIE,
  readSessionClaims,
  readSessionToken,
  setSessionCookies,
  TOKEN_COOKIE,
} from "./infrastructure/sessionCookie.server";

// Domain rules the routes apply (server-safe; the client index also has hooks).
export { validateLogin, validateRegistration, PASSWORD_MAX_LENGTH } from "./domain/credentials";
