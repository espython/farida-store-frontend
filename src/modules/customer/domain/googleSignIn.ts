// Google sign-in: which ID token claims the shop accepts, and why it refuses
// the rest. Pure domain: claims in, an identity or a reason out.

/** Who Google says signed in, once the token passed every check. */
export interface GoogleIdentity {
  /** Google's stable account id ("sub"); the link to our customer. */
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
}

/** Why a Google sign-in was refused or did not finish, as the sign-in page explains it. */
export type GoogleSignInError =
  | "cancelled" // the customer closed Google's page or said no
  | "expired" // the sign-in took too long or was opened twice (state/cookie gone)
  | "unverified_email" // Google has not verified the account's email
  | "staff" // a shop staff email: staff sign in through WordPress
  | "conflict" // this email is linked to another Google account
  | "failed"; // anything else (Google or the shop unreachable, bad token)

export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"] as const;
/** Clock difference tolerated between Google and this server. */
export const CLOCK_SKEW_SECONDS = 60;

interface Expect {
  clientId: string;
  nonce: string;
  nowSeconds: number;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

/**
 * Checks the claims of an ID token received straight from Google's token
 * endpoint over TLS (so its signature need not be checked again: OpenID
 * Connect Core 3.1.3.7): issuer, audience, expiry, our nonce, a verified email.
 */
export function checkGoogleClaims(
  claims: unknown,
  { clientId, nonce, nowSeconds }: Expect
): { ok: true; identity: GoogleIdentity } | { ok: false; error: GoogleSignInError } {
  const c = (claims ?? {}) as Record<string, unknown>;
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  const exp = typeof c.exp === "number" ? c.exp : 0;
  if (!(GOOGLE_ISSUERS as readonly unknown[]).includes(c.iss) || !aud.includes(clientId) || !nonce || c.nonce !== nonce) {
    return { ok: false, error: "failed" };
  }
  if (exp + CLOCK_SKEW_SECONDS < nowSeconds) return { ok: false, error: "expired" };
  const sub = str(c.sub);
  const email = str(c.email).trim().toLowerCase();
  if (!/^\d{1,64}$/.test(sub) || !email.includes("@")) return { ok: false, error: "failed" };
  if (c.email_verified !== true && c.email_verified !== "true") return { ok: false, error: "unverified_email" };
  return { ok: true, identity: { sub, email, firstName: str(c.given_name).trim(), lastName: str(c.family_name).trim() } };
}
