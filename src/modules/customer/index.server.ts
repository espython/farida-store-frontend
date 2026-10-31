// Server entry of the customer context. Import only from app/api and server components.
export { getSession, login, register } from "./infrastructure/authClient.server";
export type { SignedIn } from "./infrastructure/authClient.server";
export {
  clearSessionCookies,
  FLAG_COOKIE,
  readSessionToken,
  setSessionCookies,
  TOKEN_COOKIE,
} from "./infrastructure/sessionCookie.server";
