import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { clientIp, fixedWindowLimiter } from "@/shared/infrastructure/rateLimit.server";
import { register, setSessionCookies, validateRegistration } from "@/modules/customer/index.server";
import { registerBody } from "../authSchemas";

// 5 new accounts per visitor per hour, in memory (stops scripted sign-ups).
const visitorLimited = fixedWindowLimiter({ windowMs: 60 * 60 * 1000, max: 5 });

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    if (visitorLimited(clientIp(req.headers))) throw new AppError("rate_limited", "Too many attempts, please try again later", 429);
    const input = await parseJson(req, registerBody);
    const errors = validateRegistration(input);
    if (Object.keys(errors).length) throw new AppError("invalid_input", "Invalid registration details", 400, errors);
    const { token, session } = await register(input);
    const res = NextResponse.json({ session }, { status: 201 });
    setSessionCookies(res, token, session);
    return res;
  },
});
