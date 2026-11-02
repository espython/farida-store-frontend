import { describe, expect, it } from "vitest";
import { toPromoLink } from "../domain/Promotion";
import { toPromotions } from "./promoMapper";

const dto = (over: Record<string, unknown>) => ({ id: 1, placement: "mini", text: "Hi", image: null, link: null, order: 0, ...over });

describe("toPromoLink", () => {
  it("keeps storefront paths and https addresses only", () => {
    expect(toPromoLink("/categories/blenders")).toEqual({ kind: "internal", href: "/categories/blenders" });
    expect(toPromoLink(" https://example.com/x?y=1 ")).toEqual({ kind: "external", href: "https://example.com/x?y=1" });
    for (const bad of ["//evil.example", "/\\evil.example", "http://plain.example", "javascript:alert(1)", "data:text/html,x", "categories", "", null, 5]) {
      expect(toPromoLink(bad)).toBeNull();
    }
  });
});

describe("toPromotions", () => {
  it("groups by placement in order, decodes text, and keeps safe images", () => {
    const p = toPromotions([
      dto({ id: 3, placement: "hero", text: "Sale", image: { url: "https://wp.test/a.jpg", width: 1600, height: 900, alt: "" }, link: "/categories/a" }),
      dto({ id: 4, placement: "announcement", text: "Pots &amp; pans" }),
      dto({ id: 5, placement: "mini", text: "Deals", link: "//evil.example" }),
      dto({ id: 6, placement: "hero", text: "SVG", image: { url: "https://wp.test/b.svg", width: null, height: 0, alt: "B" } }),
    ]);
    expect(p.hero.map((h) => h.id)).toEqual(["3", "6"]);
    expect(p.hero[0]).toMatchObject({ link: { kind: "internal", href: "/categories/a" }, image: { width: 1600, height: 900 } });
    expect(p.hero[1].image).toMatchObject({ width: null, height: null, alt: "B" });
    expect(p.announcements[0].text).toBe("Pots & pans");
    expect(p.mini[0].link).toBeNull();
  });

  it("drops unknown placements, banners without a safe image and empty messages", () => {
    const p = toPromotions([
      dto({ placement: "popup" }),
      dto({ placement: "hero", image: null }),
      dto({ placement: "hero", image: { url: "javascript:alert(1)", width: 1, height: 1, alt: "" } }),
      dto({ placement: "announcement", text: "   " }),
    ]);
    expect(p).toEqual({ hero: [], announcements: [], mini: [] });
    expect(toPromotions({ not: "a list" })).toEqual({ hero: [], announcements: [], mini: [] });
  });
});
