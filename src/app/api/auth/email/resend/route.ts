import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { clientIp, fixedWindowLimiter } from "@/shared/infrastructure/rateLimit.server";
import { absoluteUrl } from "@/shared/lib/siteUrl";
import { sendEmailVerification } from "@/modules/customer/index.server";
import { verifiedCaller } from "../../../shop/cart/cartRoute";
import { resendVerificationBody } from "../../authSchemas";

// 5 requests per visitor per 15 minutes; WordPress also waits a minute between two emails.
const visitorLimited = fixedWindowLimiter({ windowMs: 15 * 60 * 1000, max: 5 });

// "Send the confirmation email again", for the signed-in customer (id checked with WordPress).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    if (visitorLimited(clientIp(req.headers))) throw new AppError("rate_limited", "Too many attempts, please try again later", 429);
    const { locale } = await parseJson(req, resendVerificationBody);
    const { customerId } = await verifiedCaller(req);
    const status = await sendEmailVerification(customerId, locale, absoluteUrl(`/${locale}/verify-email`));
    return NextResponse.json({ status }, { status: 202, headers: { "Cache-Control": "no-store" } });
  },
});
