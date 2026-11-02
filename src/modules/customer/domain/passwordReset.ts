// Password reset: the link a customer gets by email, and how long it works.
// Pure domain: no React, Redux, Next or WordPress.

/** How long a reset link works (WordPress enforces it: farida-account mu-plugin). */
export const RESET_LINK_HOURS = 1;

/** What the emailed link carries: WordPress's one-time key and the account's login name. */
export interface ResetLink {
  key: string;
  login: string;
}

// WordPress keys are 20 letters and digits; logins are short and printable.
const KEY = /^[A-Za-z0-9]{8,64}$/;
const LOGIN = /^[^\s\u0000-\u001f\u007f]{1,60}$/;

/** The link's parameters as read from the page URL, or null when they cannot be a reset link. */
export const toResetLink = (key: unknown, login: unknown): ResetLink | null =>
  typeof key === "string" && typeof login === "string" && KEY.test(key) && LOGIN.test(login) ? { key, login } : null;
