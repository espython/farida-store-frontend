import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { decideRoute, FLAG_COOKIE, isSessionExpired, TOKEN_COOKIE, tokenExpiry } from "@/modules/customer/index.edge";
import { locales, localePrefix } from "./navigation";

// Built once, not per request.
const handleI18nRouting = createMiddleware({ defaultLocale: "en", localePrefix, locales });

/**
 * Page access, then next-intl routing. A session counts when its token cookie
 * holds an unexpired token; WordPress checks the signature whenever the BFF
 * uses it, so this only decides which page to show. The rules are the
 * customer domain's (routeAccess).
 */
export default function middleware(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const expiresAt = token ? tokenExpiry(token) : null;
  const signedIn = expiresAt !== null && !isSessionExpired({ expiresAt });

  const decision = decideRoute(req.nextUrl.pathname, req.nextUrl.search, signedIn);
  const response = decision.kind === "redirect" ? NextResponse.redirect(new URL(decision.to, req.url)) : handleI18nRouting(req);

  // A token that is unreadable or expired is dropped, with the flag that mirrors it.
  if (token && !signedIn) {
    response.cookies.delete(TOKEN_COOKIE);
    response.cookies.delete(FLAG_COOKIE);
  }
  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(en|ar)/:path*"],
};
