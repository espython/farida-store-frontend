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
  // Customer auth (A1): JWT sign-in and verification, and registration.
  { method: "POST", pattern: /^\/jwt-auth\/v1\/token$/ },
  { method: "GET", pattern: /^\/wp\/v2\/users\/me$/ },
  { method: "POST", pattern: /^\/wc\/v3\/customers$/ },
  // Customer cart (C2): Store API with the customer's JWT and Cart-Token.
  { method: "GET", pattern: /^\/wc\/store\/v1\/cart$/ },
  { method: "POST", pattern: /^\/wc\/store\/v1\/cart\/(add-item|update-item|remove-item)$/ },
  { method: "DELETE", pattern: /^\/wc\/store\/v1\/cart\/items$/ },
  // Checkout (C3): address, shipping rate, coupons, place order.
  { method: "POST", pattern: /^\/wc\/store\/v1\/cart\/(update-customer|select-shipping-rate|apply-coupon|remove-coupon)$/ },
  { method: "POST", pattern: /^\/wc\/store\/v1\/checkout$/ },
  // Orders (O1): the customer's list (always filtered by customer) and one order.
  { method: "GET", pattern: /^\/wc\/v3\/orders$/ },
  { method: "GET", pattern: /^\/wc\/v3\/orders\/\d+$/ },
  // Account (A4): the signed-in customer's own profile and address book.
  { method: "GET", pattern: /^\/wc\/v3\/customers\/\d+$/ },
  { method: "PUT", pattern: /^\/wc\/v3\/customers\/\d+$/ },
  // Reviews (O3): the public list, and the customer's own review (held for approval).
  { method: "GET", pattern: /^\/wc\/store\/v1\/products\/reviews$/ },
  { method: "GET", pattern: /^\/wc\/v3\/products\/reviews$/ },
  { method: "POST", pattern: /^\/wc\/v3\/products\/reviews$/ },
];

export function isWooRouteAllowed(
  method: string,
  path: string,
  allowlist: readonly AllowedWooRoute[] = WOO_ALLOWLIST
): boolean {
  return allowlist.some((r) => r.method === method && r.pattern.test(path));
}
