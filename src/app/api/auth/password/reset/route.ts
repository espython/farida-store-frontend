import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { clientIp, fixedWindowLimiter } from "@/shared/infrastructure/rateLimit.server";
import { passwordError, resetPassword, setSessionCookies, toResetLink } from "@/modules/customer/index.server";
import { resetPasswordBody } from "../../authSchemas";

// 10 attempts per visitor per 15 minutes: keys are long and single use, this
// only stops someone hammering the route.
const visitorLimited = fixedWindowLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

// Set a new password with the emailed link, then sign in: the token goes into
// the httpOnly cookie, the body carries the session (like /login).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    if (visitorLimited(clientIp(req.headers))) throw new AppError("rate_limited", "Too many attempts, please try again later", 429);
    const { key, login, password } = await parseJson(req, resetPasswordBody);
    const weak = passwordError(password);
    if (weak) throw new AppError("invalid_input", "Choose another password", 400, { password: weak });
    const link = toResetLink(key, login);
    if (!link) throw new AppError("invalid_reset_link", "The reset link is invalid or has expired", 400);
    const { token, session } = await resetPassword(link, password);
    const res = NextResponse.json({ session }, { headers: { "Cache-Control": "no-store" } });
    setSessionCookies(res, token, session);
    return res;
  },
});
