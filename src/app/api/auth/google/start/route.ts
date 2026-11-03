import { NextResponse, type NextRequest } from "next/server";
import { defineRoute } from "@/shared/infrastructure/bff";
import { clientIp, fixedWindowLimiter } from "@/shared/infrastructure/rateLimit.server";
import { absoluteUrl } from "@/shared/lib/siteUrl";
import { GOOGLE_CALLBACK_PATH, googleAuthorizeUrl, googleConfig, newGoogleFlow, safeNextPath, setGoogleFlowCookie } from "@/modules/customer/index.server";

// 20 starts per visitor per 15 minutes (each one is a full round trip to Google).
const visitorLimited = fixedWindowLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

/**
 * "Continue with Google": remember this attempt (state, PKCE verifier, nonce,
 * where to come back) in a short httpOnly cookie, then go to Google.
 */
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req: NextRequest) => {
    const params = req.nextUrl.searchParams;
    const locale = params.get("locale") === "ar" ? "ar" : "en";
    const config = googleConfig();
    if (!config || visitorLimited(clientIp(req.headers))) {
      return NextResponse.redirect(absoluteUrl(`/${locale}/login?google=failed`));
    }
    const { flow, challenge } = newGoogleFlow(locale, safeNextPath(params.get("next")));
    const res = NextResponse.redirect(googleAuthorizeUrl(config.clientId, absoluteUrl(GOOGLE_CALLBACK_PATH), flow, challenge));
    setGoogleFlowCookie(res, flow);
    return res;
  },
});
