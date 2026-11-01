import { NextResponse } from "next/server";
import { setCartToken } from "@/modules/cart/index.server";
import type { CheckoutResult } from "@/modules/checkout/index.server";

/** The checkout as JSON, never cached, keeping the (possibly new) cart token. */
export function checkoutResponse(customerId: string, result: CheckoutResult) {
  const res = NextResponse.json({ checkout: result.checkout }, { headers: { "Cache-Control": "private, no-store" } });
  setCartToken(res, customerId, result.cartToken);
  return res;
}
