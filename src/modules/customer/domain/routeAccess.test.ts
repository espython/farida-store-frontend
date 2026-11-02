import { describe, expect, it } from "vitest";
import { decideRoute, safeNextPath, splitLocale } from "./routeAccess";

const go = (path: string, signedIn: boolean, search = "") => decideRoute(path, search, signedIn);

describe("decideRoute", () => {
  it.each([
    "/en/user", "/ar/useraddresses", "/en/userorders", "/ar/userprofile", "/en/order", "/en/order/298",
    "/ar/trackorder", "/en/trackorder/298", "/en/cart/shipping", "/ar/cart/payment", "/en/cart/confirmation",
  ])("sends a guest from %s to sign in, in the same language, and back", (path) => {
    const locale = path.split("/")[1];
    expect(go(path, false)).toEqual({ kind: "redirect", to: `/${locale}/login?next=${encodeURIComponent(path)}` });
    expect(go(path, true)).toEqual({ kind: "continue" });
  });

  it("keeps the query in next", () => {
    expect(go("/en/cart/confirmation", false, "?order_number=298")).toEqual({
      kind: "redirect",
      to: `/en/login?next=${encodeURIComponent("/en/cart/confirmation?order_number=298")}`,
    });
  });

  // The old middleware matched with includes(): these were wrongly redirected.
  it.each([
    "/en/product/shipping-box", "/en/categories/user-manuals", "/ar/product/order-organizer", "/en/search",
    "/en/cart", "/en/contact", "/en/wishlist", "/en/forgot-password", "/en/reset-password", "/en/product/login-lamp",
  ])("lets anyone open %s", (path) => {
    expect(go(path, false)).toEqual({ kind: "continue" });
    expect(go(path, true)).toEqual({ kind: "continue" });
  });

  it("sends a signed-in customer from login/register to next, or their account", () => {
    expect(go("/ar/login", true)).toEqual({ kind: "redirect", to: "/ar/user" });
    expect(go("/en/register", true)).toEqual({ kind: "redirect", to: "/en/user" });
    expect(go("/en/login", true, "?next=%2Fen%2Fcart%2Fshipping")).toEqual({ kind: "redirect", to: "/en/cart/shipping" });
    expect(go("/en/login", true, "?next=%2F%2Fevil.test")).toEqual({ kind: "redirect", to: "/en/user" });
    expect(go("/en/login", false)).toEqual({ kind: "continue" });
  });

  it("sends /product with no product home", () => {
    expect(go("/ar/product", false)).toEqual({ kind: "redirect", to: "/ar" });
    expect(go("/ar/product/kettle", false)).toEqual({ kind: "continue" });
  });

  it("leaves paths without a locale to the i18n routing", () => {
    expect(go("/", false)).toEqual({ kind: "continue" });
    expect(go("/user", false)).toEqual({ kind: "continue" });
  });
});

describe("safeNextPath", () => {
  it("accepts our localized pages", () => {
    expect(safeNextPath("/en/userorders")).toBe("/en/userorders");
    expect(safeNextPath("/ar/cart/confirmation?order_number=3")).toBe("/ar/cart/confirmation?order_number=3");
  });
  it.each([
    null, "", "en/user", "//evil.test", "/\\evil.test", "https://evil.test/en", "/fr/user", "/en/login", "/ar/register?x=1",
    "/en/user\nSet-Cookie: x", "/" + "a".repeat(600),
  ])("refuses %j", (raw) => {
    expect(safeNextPath(raw)).toBeNull();
  });
});

describe("splitLocale", () => {
  it("splits the locale off", () => {
    expect(splitLocale("/ar/userorders/")).toEqual({ locale: "ar", segments: ["userorders"] });
    expect(splitLocale("/de/x")).toBeNull();
  });
});
