// Email confirmation: a reminder, never a gate (owner decision 2026-11-03).
// Pure domain: no React, Redux, Next or WordPress.

/** How long a confirmation link works (WordPress enforces it: farida-account mu-plugin). */
export const VERIFY_LINK_HOURS = 48;

/** What the emailed link carries: the customer id and a one-time token. */
export interface VerifyLink {
  id: string;
  token: string;
}

/** The link's parameters as read from the page URL, or null when they cannot be a confirmation link. */
export const toVerifyLink = (id: unknown, token: unknown): VerifyLink | null =>
  typeof id === "string" && typeof token === "string" && /^[1-9]\d{0,11}$/.test(id) && /^[A-Za-z0-9]{16,64}$/.test(token)
    ? { id, token }
    : null;

/** What asking for a (new) link did: sent now, sent less than a minute ago, or nothing to do. */
export type VerificationSent = "sent" | "recent" | "verified";
