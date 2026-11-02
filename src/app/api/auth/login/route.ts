import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { clientIp, fixedWindowLimiter } from "@/shared/infrastructure/rateLimit.server";
import { login, normaliseEmail, setSessionCookies, validateLogin } from "@/modules/customer/index.server";
import { loginBody } from "../authSchemas";

// 20 attempts per visitor and 10 per email address per 15 minutes, in memory.
// WordPress also locks an account after 10 wrong passwords (farida-hardening);
// it sees only this server's address, so the per-visitor limit lives here.
const visitorLimited = fixedWindowLimiter({ windowMs: 15 * 60 * 1000, max: 20 });
const addressLimited = fixedWindowLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
const tooMany = () => new AppError("rate_limited", "Too many attempts, please try again later", 429);

// The token goes into the httpOnly cookie only; the body carries the session.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    if (visitorLimited(clientIp(req.headers))) throw tooMany();
    const { email, password } = await parseJson(req, loginBody);
    const errors = validateLogin(email, password);
    if (Object.keys(errors).length) throw new AppError("invalid_input", "Invalid sign-in details", 400, errors);
    if (addressLimited(normaliseEmail(email))) throw tooMany();
    const { token, session } = await login(email, password);
    const res = NextResponse.json({ session });
    setSessionCookies(res, token, session);
    return res;
  },
});
