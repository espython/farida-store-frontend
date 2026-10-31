/**
 * A signed-in customer as the storefront sees them. The token itself is never
 * part of the domain: it lives only in the httpOnly cookie and the BFF.
 */
export interface Session {
  customerId: string;
  email: string;
  displayName: string;
  /** Token expiry, epoch seconds. */
  expiresAt: number;
}

/** Refuse sessions this close to expiry, so a request does not die half-way. */
export const EXPIRY_LEEWAY_SECONDS = 60;

export const nowSeconds = (now: Date = new Date()) => Math.floor(now.getTime() / 1000);

export const secondsUntilExpiry = (session: Pick<Session, "expiresAt">, now: Date = new Date()) =>
  Math.max(0, session.expiresAt - nowSeconds(now));

export const isSessionExpired = (session: Pick<Session, "expiresAt">, now: Date = new Date()) =>
  secondsUntilExpiry(session, now) <= EXPIRY_LEEWAY_SECONDS;
