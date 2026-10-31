import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { getSession, readSessionClaims } from "@/modules/customer/index.server";
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

/**
 * Like cartCaller, but the customer id is verified with WordPress (one call).
 * Required wherever the id itself authorizes something: reading an order with
 * the server keys, or replaying a placed order. The cookie's claims are only
 * decoded, so on their own they can name any customer.
 */
export async function verifiedCaller(req: NextRequest): Promise<CartCaller & { customerId: string }> {
  const caller = cartCaller(req);
  const session = await getSession(caller.jwt);
  if (!session || session.customerId !== caller.customerId) throw new AppError("unauthenticated", "Session expired", 401);
  return caller;
}

/** The cart as JSON, never cached, with the (possibly new) token kept for next time. */
export function cartResponse(customerId: string, result: CartResult, extra: Record<string, unknown> = {}) {
  const res = NextResponse.json({ cart: result.cart, ...extra }, { headers: { "Cache-Control": "private, no-store" } });
  setCartToken(res, customerId, result.cartToken);
  return res;
}
