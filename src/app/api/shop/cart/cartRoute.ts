import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { readSessionClaims } from "@/modules/customer/index.server";
import { readCartToken, setCartToken, type CartCaller, type CartResult } from "@/modules/cart/index.server";

/**
 * The signed-in customer's cart caller: their JWT plus the Cart-Token bound to
 * them. Guests have no server cart (their cart lives in the browser), so no
 * session means 401.
 */
export function cartCaller(req: NextRequest): CartCaller & { customerId: string } {
  const claims = readSessionClaims(req);
  if (!claims) throw new AppError("unauthenticated", "Sign in to use the saved cart", 401);
  return { jwt: claims.token, cartToken: readCartToken(req, claims.customerId), customerId: claims.customerId };
}

/** The cart as JSON, never cached, with the (possibly new) token kept for next time. */
export function cartResponse(customerId: string, result: CartResult, extra: Record<string, unknown> = {}) {
  const res = NextResponse.json({ cart: result.cart, ...extra }, { headers: { "Cache-Control": "private, no-store" } });
  setCartToken(res, customerId, result.cartToken);
  return res;
}
