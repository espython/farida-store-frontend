export interface AllowedWooRoute {
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Matched against the whole path, e.g. /wc/store/v1/products/123 */
  pattern: RegExp;
}

/**
 * The only Woo endpoints the BFF may call. Add an entry with the task that
 * needs it; never widen this to a catch-all.
 */
export const WOO_ALLOWLIST: readonly AllowedWooRoute[] = [
  { method: "GET", pattern: /^\/wc\/store\/v1\/products$/ },
  { method: "GET", pattern: /^\/wc\/store\/v1\/products\/(?!categories$|attributes$)[^/]+$/ },
  { method: "GET", pattern: /^\/wc\/store\/v1\/products\/categories$/ },
  { method: "GET", pattern: /^\/wc\/store\/v1\/products\/attributes$/ },
  { method: "GET", pattern: /^\/wc\/store\/v1\/products\/attributes\/\d+\/terms$/ },
];

export function isWooRouteAllowed(
  method: string,
  path: string,
  allowlist: readonly AllowedWooRoute[] = WOO_ALLOWLIST
): boolean {
  return allowlist.some((r) => r.method === method && r.pattern.test(path));
}
