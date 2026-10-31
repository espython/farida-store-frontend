import type { Session } from "../domain/Session";
import type { WpJwtPayload, WpTokenResponse, WpUserMe } from "./wpAuthDto";

/**
 * Read the claims of a JWT without verifying it. Only for tokens that WordPress
 * has just issued or just validated; never trust the result on its own.
 */
export const decodeJwtPayload = (token: string): WpJwtPayload | null => {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const p = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Partial<WpJwtPayload>;
    const id = p?.data?.user?.id;
    if (!Number.isFinite(p.exp) || !Number.isFinite(p.iat)) return null;
    if ((typeof id !== "string" && typeof id !== "number") || String(id) === "") return null;
    return p as WpJwtPayload;
  } catch {
    return null;
  }
};

/** WP token response + its claims → Session. */
export const toSession = (res: Pick<WpTokenResponse, "user_email" | "user_display_name">, payload: WpJwtPayload): Session => ({
  customerId: String(payload.data.user.id),
  email: res.user_email,
  displayName: res.user_display_name || res.user_email,
  expiresAt: payload.exp,
});

/** users/me (fetched with the token, so verified by WordPress) + token claims → Session. */
export const toSessionFromUser = (user: WpUserMe, payload: WpJwtPayload): Session => ({
  customerId: String(user.id),
  email: user.email,
  // The username is random (registration keeps emails out of author URLs),
  // so prefer the customer's real name.
  displayName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.name || user.email,
  expiresAt: payload.exp,
});
