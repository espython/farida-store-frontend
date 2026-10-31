import { NextResponse } from "next/server";
import { defineRoute } from "@/shared/infrastructure/bff";
import { clearSessionCookies } from "@/modules/customer/index.server";
import { clearCartToken } from "@/modules/cart/index.server";

// The WP JWT plugin cannot revoke a token; signing out drops the cookies and
// the token dies at its expiry.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async () => {
    const res = NextResponse.json({ ok: true });
    clearSessionCookies(res);
    // The cart token reads the saved cart on its own; do not leave it behind.
    clearCartToken(res);
    return res;
  },
});
