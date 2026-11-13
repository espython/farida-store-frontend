import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { clientIp, fixedWindowLimiter } from "@/shared/infrastructure/rateLimit.server";
import { toVerifyLink, verifyEmail } from "@/modules/customer/index.server";
import { verifyEmailBody } from "../../authSchemas";

// 20 attempts per visitor per 15 minutes: tokens are long and random, this only stops hammering.
const visitorLimited = fixedWindowLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

// Confirm an email with the emailed link. No session needed (the link may be opened on another
// device): the token is the proof.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    if (visitorLimited(clientIp(req.headers))) throw new AppError("rate_limited", "Too many attempts, please try again later", 429);
    const { id, token } = await parseJson(req, verifyEmailBody);
    const link = toVerifyLink(id, token);
    if (!link) throw new AppError("invalid_verify_link", "The confirmation link is invalid or has expired", 400);
    await verifyEmail(link);
    return NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
  },
});
