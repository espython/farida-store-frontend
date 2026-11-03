// Which storefront pages need a signed-in customer, which are for guests only,
// and where to send someone who is on the wrong one. Pure domain: paths in,
// decisions out; the middleware applies them (A3 #244).
import { isLocale, type Locale } from "@/shared/kernel/Locale";

/** Pages (by their path after the locale) that need a signed-in customer. Matched by whole segments. */
const SIGNED_IN_ONLY: readonly string[][] = [
  ["user"],
  ["useraddresses"],
  ["userorders"],
  ["userprofile"],
  ["order"],
  ["trackorder"],
  // Checkout is for signed-in customers; guests sign in and come back here.
  ["cart", "shipping"],
  ["cart", "payment"],
  ["cart", "confirmation"],
];

/** Pages a signed-in customer has no use for. */
const GUESTS_ONLY: readonly string[][] = [["login"], ["register"]];

/** Where a signed-in customer lands from a guest-only page with no usable `next`. */
const SIGNED_IN_HOME = "/user";

export type RouteDecision = { kind: "continue" } | { kind: "redirect"; to: string };

const startsWith = (segments: string[], prefix: readonly string[]) => prefix.every((p, i) => segments[i] === p);

/** "/ar/userorders/" → { locale: "ar", segments: ["userorders"] }; null without a locale prefix. */
export function splitLocale(pathname: string): { locale: Locale; segments: string[] } | null {
  const [first, ...rest] = pathname.split("/").filter(Boolean);
  return isLocale(first) ? { locale: first, segments: rest } : null;
}

/**
 * A path the sign-in page may send the customer back to: one of our own
 * localized pages ("/en/…" or "/ar/…"), never another site ("//evil.test",
 * "/\evil.test", "https://…") or a guest-only page.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 512) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  const path = raw.split(/[?#]/)[0];
  const parts = splitLocale(path);
  if (!parts) return null;
  if (GUESTS_ONLY.some((p) => startsWith(parts.segments, p))) return null;
  return raw;
}

/**
 * The decision for one request. `pathname` includes the locale; `search` is
 * the query string ("" or "?…"), kept in `next` so the customer returns to
 * the exact page.
 */
export function decideRoute(pathname: string, search: string, signedIn: boolean): RouteDecision {
  const parts = splitLocale(pathname);
  if (!parts) return { kind: "continue" }; // "/" and unknown prefixes: the i18n routing decides
  const { locale, segments } = parts;

  // /product with no product: nothing to show.
  if (segments.length === 1 && segments[0] === "product") return { kind: "redirect", to: `/${locale}` };

  if (!signedIn && SIGNED_IN_ONLY.some((p) => startsWith(segments, p))) {
    const next = encodeURIComponent(`${pathname}${search}`);
    return { kind: "redirect", to: `/${locale}/login?next=${next}` };
  }
  if (signedIn && GUESTS_ONLY.some((p) => startsWith(segments, p))) {
    const next = safeNextPath(new URLSearchParams(search).get("next"));
    return { kind: "redirect", to: next ?? `/${locale}${SIGNED_IN_HOME}` };
  }
  return { kind: "continue" };
}
