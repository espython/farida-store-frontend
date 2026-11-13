import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute } from "@/shared/infrastructure/bff";
import { absoluteUrl } from "@/shared/lib/siteUrl";
import {
  checkGoogleClaims,
  clearGoogleFlowCookie,
  exchangeGoogleCode,
  GOOGLE_CALLBACK_PATH,
  googleConfig,
  readGoogleFlow,
  setSessionCookies,
  signInWithGoogle,
  type GoogleSignInError,
} from "@/modules/customer/index.server";

const sameString = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

const ERRORS: Record<string, GoogleSignInError> = { google_staff: "staff", google_conflict: "conflict" };

/**
 * Google sends the customer back here. Every outcome ends in a redirect to the
 * shop: home (or the page that asked for sign-in) with the session cookies,
 * or the sign-in page with ?google=<reason>. The attempt's cookie is always cleared.
 */
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req: NextRequest) => {
    const params = req.nextUrl.searchParams;
    const flow = readGoogleFlow(req);
    const locale = flow?.locale ?? "en";
    const fail = (reason: GoogleSignInError) => {
      const res = NextResponse.redirect(absoluteUrl(`/${locale}/login?google=${reason}`));
      clearGoogleFlowCookie(res);
      return res;
    };

    const config = googleConfig();
    if (!config) return fail("failed");
    if (!flow) return fail("expired");
    if (params.get("error")) return fail("cancelled");
    const code = params.get("code");
    const state = params.get("state") ?? "";
    if (!code || !sameString(state, flow.state)) return fail("failed");

    try {
      const claims = await exchangeGoogleCode(code, flow.verifier, absoluteUrl(GOOGLE_CALLBACK_PATH));
      const checked = checkGoogleClaims(claims, { clientId: config.clientId, nonce: flow.nonce, nowSeconds: Math.floor(Date.now() / 1000) });
      if (!checked.ok) return fail(checked.error);
      const { token, session } = await signInWithGoogle(checked.identity);
      const res = NextResponse.redirect(absoluteUrl(flow.next ?? `/${locale}`));
      setSessionCookies(res, token, session);
      clearGoogleFlowCookie(res);
      return res;
    } catch (err) {
      if (err instanceof AppError && ERRORS[err.code]) return fail(ERRORS[err.code]);
      console.error("[auth] Google sign-in failed", err);
      return fail("failed");
    }
  },
});
