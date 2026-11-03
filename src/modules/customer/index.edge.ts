// Edge entry of the customer context, for src/middleware.ts only: pure route
// rules and the token expiry reader. No React, Redux or Node APIs (the client
// index pulls in hooks, the server index pulls in node:crypto).
export { decideRoute, safeNextPath, splitLocale } from "./domain/routeAccess";
export type { RouteDecision } from "./domain/routeAccess";
export { isSessionExpired } from "./domain/Session";
export { tokenExpiry } from "./infrastructure/sessionToken";
export { FLAG_COOKIE, TOKEN_COOKIE } from "./infrastructure/sessionCookieNames";
