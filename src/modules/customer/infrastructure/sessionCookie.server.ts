import type { NextRequest, NextResponse } from "next/server";
import { isSessionExpired, secondsUntilExpiry, type Session } from "../domain/Session";
import { decodeJwtPayload } from "./sessionMapper";

/**
 * The session lives in two cookies (unchanged from the Strapi setup):
 * - `credentials`: the token, httpOnly, never readable from JS
 * - `logged_in`: a readable flag so client code can show the signed-in UI
 * Both share the token's remaining lifetime, so the browser drops them when it
 * expires and the middleware then treats the visitor as signed out.
 */
export const TOKEN_COOKIE = "credentials";
export const FLAG_COOKIE = "logged_in";

const base = () => ({ secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" });

export const readSessionToken = (req: NextRequest): string | null => req.cookies.get(TOKEN_COOKIE)?.value || null;

/**
 * The session token and the customer id it claims, without asking WordPress.
 * Only for calls that WordPress itself authenticates with the token (Store
 * API cart); the id is used to bind other cookies to this customer, never to
 * authorize anything on its own. Null when missing, malformed or expired.
 */
export const readSessionClaims = (req: NextRequest): { token: string; customerId: string } | null => {
  const token = readSessionToken(req);
  const payload = token ? decodeJwtPayload(token) : null;
  if (!token || !payload || isSessionExpired({ expiresAt: payload.exp })) return null;
  return { token, customerId: String(payload.data.user.id) };
};

export function setSessionCookies(res: NextResponse, token: string, session: Session, now: Date = new Date()) {
  const maxAge = secondsUntilExpiry(session, now);
  res.cookies.set(TOKEN_COOKIE, token, { ...base(), httpOnly: true, maxAge });
  res.cookies.set(FLAG_COOKIE, "1", { ...base(), httpOnly: false, maxAge });
}

export function clearSessionCookies(res: NextResponse) {
  for (const [name, httpOnly] of [
    [TOKEN_COOKIE, true],
    [FLAG_COOKIE, false],
  ] as const) {
    res.cookies.set(name, "", { ...base(), httpOnly, maxAge: 0 });
  }
}
