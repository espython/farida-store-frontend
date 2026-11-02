import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { clientIp, fixedWindowLimiter } from "@/shared/infrastructure/rateLimit.server";
import { absoluteUrl } from "@/shared/lib/siteUrl";
import { emailError, normaliseEmail, requestPasswordReset } from "@/modules/customer/index.server";
import { forgotPasswordBody } from "../../authSchemas";

// 5 requests per visitor per 15 minutes; 3 emails per address per hour (the
// rest are dropped quietly, so a stranger cannot flood someone's inbox).
// WordPress also waits a minute between two emails to one account.
const visitorLimited = fixedWindowLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
const addressLimited = fixedWindowLimiter({ windowMs: 60 * 60 * 1000, max: 3 });

// "Forgot password": the answer is the same whether or not the email has an
// account, so the form cannot be used to find out who shops here.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    if (visitorLimited(clientIp(req.headers))) throw new AppError("rate_limited", "Too many attempts, please try again later", 429);
    const { email, locale } = await parseJson(req, forgotPasswordBody);
    const invalid = emailError(email);
    if (invalid) throw new AppError("invalid_input", "Enter a valid email address", 400, { email: invalid });
    if (!addressLimited(normaliseEmail(email))) {
      await requestPasswordReset(email, locale, absoluteUrl(`/${locale}/reset-password`));
    }
    return NextResponse.json({ ok: true }, { status: 202, headers: { "Cache-Control": "no-store" } });
  },
});
