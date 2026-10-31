import type { NextRequest, NextResponse } from "next/server";

/**
 * The Store API Cart-Token of a signed-in customer, in an httpOnly cookie.
 *
 * The token is a capability: it reads its cart without any JWT, and when sent
 * together with a JWT it wins over the JWT (spike-cart.mjs). So it is bound
 * to the customer id it was issued for; a token for anyone else is ignored,
 * which also covers a second customer signing in on the same browser.
 */
export const CART_TOKEN_COOKIE = "cart_token";
const MAX_AGE = 60 * 60 * 24 * 7;

const options = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

export const readCartToken = (req: NextRequest, customerId: string): string | null => {
  const raw = req.cookies.get(CART_TOKEN_COOKIE)?.value ?? "";
  const dot = raw.indexOf(".");
  if (dot <= 0) return null;
  return raw.slice(0, dot) === customerId ? raw.slice(dot + 1) || null : null;
};

export const setCartToken = (res: NextResponse, customerId: string, token: string) =>
  res.cookies.set(CART_TOKEN_COOKIE, `${customerId}.${token}`, { ...options(), maxAge: MAX_AGE });

export const clearCartToken = (res: NextResponse) => res.cookies.set(CART_TOKEN_COOKIE, "", { ...options(), maxAge: 0 });
