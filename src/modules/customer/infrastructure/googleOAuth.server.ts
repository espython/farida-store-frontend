import { createHash, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";

// Google's OAuth 2.0 / OpenID Connect endpoints (authorization code + PKCE),
// and the short-lived cookie that carries one sign-in attempt from /start to
// /callback. Server-only: the client secret never leaves this file's callers.

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TIMEOUT_MS = 8000;

/** Where Google sends the customer back (must be listed in the OAuth client's redirect URIs). */
export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

export const GOOGLE_FLOW_COOKIE = "g_flow";
const FLOW_MAX_AGE = 10 * 60;
const FLOW_PATH = "/api/auth/google";

/** One sign-in attempt: the values Google must send back, and where to return the customer. */
export interface GoogleFlow {
  state: string;
  verifier: string;
  nonce: string;
  locale: "en" | "ar";
  /** A path already checked with safeNextPath, or null. */
  next: string | null;
}

export function googleConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

const b64url = (b: Buffer) => b.toString("base64url");

export function newGoogleFlow(locale: "en" | "ar", next: string | null): { flow: GoogleFlow; challenge: string } {
  const verifier = b64url(randomBytes(48));
  return {
    flow: { state: b64url(randomBytes(24)), verifier, nonce: b64url(randomBytes(24)), locale, next },
    challenge: b64url(createHash("sha256").update(verifier).digest()),
  };
}

export function googleAuthorizeUrl(clientId: string, redirectUri: string, flow: GoogleFlow, challenge: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    hl: flow.locale,
  }).toString();
  return url.toString();
}

/** httpOnly, Lax (sent on Google's top-level redirect back), only to /api/auth/google, 10 minutes. */
export function setGoogleFlowCookie(res: NextResponse, flow: GoogleFlow) {
  res.cookies.set(GOOGLE_FLOW_COOKIE, JSON.stringify(flow), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: FLOW_PATH,
    maxAge: FLOW_MAX_AGE,
  });
}

export function clearGoogleFlowCookie(res: NextResponse) {
  res.cookies.set(GOOGLE_FLOW_COOKIE, "", { httpOnly: true, sameSite: "lax", path: FLOW_PATH, maxAge: 0 });
}

export function readGoogleFlow(req: NextRequest): GoogleFlow | null {
  const raw = req.cookies.get(GOOGLE_FLOW_COOKIE)?.value;
  if (!raw || raw.length > 2000) return null;
  try {
    const f = JSON.parse(raw) as Partial<GoogleFlow>;
    if (typeof f.state !== "string" || typeof f.verifier !== "string" || typeof f.nonce !== "string") return null;
    return {
      state: f.state,
      verifier: f.verifier,
      nonce: f.nonce,
      locale: f.locale === "ar" ? "ar" : "en",
      next: typeof f.next === "string" ? f.next : null,
    };
  } catch {
    return null;
  }
}

/** Exchange the code for tokens (with the PKCE verifier) and return the ID token's claims, decoded. */
export async function exchangeGoogleCode(code: string, verifier: string, redirectUri: string): Promise<unknown> {
  const config = googleConfig();
  if (!config) throw new AppError("internal_error", "Google sign-in is not configured", 500);
  let res: Response;
  try {
    res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new AppError("upstream_error", "Google did not answer", 502);
  }
  const body = (await res.json().catch(() => null)) as { id_token?: unknown } | null;
  if (!res.ok || typeof body?.id_token !== "string") throw new AppError("upstream_error", "Google refused the code", 502);
  const payload = body.id_token.split(".")[1];
  try {
    return JSON.parse(Buffer.from(payload ?? "", "base64url").toString("utf8"));
  } catch {
    throw new AppError("upstream_error", "Unreadable ID token", 502);
  }
}
