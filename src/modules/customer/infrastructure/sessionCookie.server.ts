import type { NextRequest, NextResponse } from "next/server";
import { secondsUntilExpiry, type Session } from "../domain/Session";

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
