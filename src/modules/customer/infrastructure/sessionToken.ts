// Reads the expiry out of the session token without Node APIs, so the
// middleware (edge runtime) can use it. Only decodes: the signature is checked
// by WordPress whenever the BFF uses the token.

/** The token's `exp` (epoch seconds), or null when it is not a readable JWT. */
export function tokenExpiry(token: string): number | null {
  const part = token.split(".")[1];
  if (!part || part.length > 4096) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" && Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}
