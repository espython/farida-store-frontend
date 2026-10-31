import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, errorResponse } from "@/shared/infrastructure/bff";
import { clearSessionCookies, getSession, readSessionToken } from "@/modules/customer/index.server";

// Current customer, verified by WordPress. An expired, tampered or orphaned
// token clears the cookies, so the middleware sends the visitor to sign in.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const token = readSessionToken(req);
    const session = token ? await getSession(token) : null;
    if (session) {
      return NextResponse.json({ session }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const res = errorResponse(new AppError("unauthenticated", "Not signed in", 401));
    if (token) clearSessionCookies(res);
    return res;
  },
});
