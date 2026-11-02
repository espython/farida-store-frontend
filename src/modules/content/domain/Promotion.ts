// Shop promotions edited in WordPress (W7): home hero banners, the announcement
// bar and category mini-ads. Pure domain: no React, Redux, Next or WordPress.

export type PromoPlacement = "hero" | "announcement" | "mini";

export interface PromoImage {
  url: string;
  /** Unknown for SVGs. */
  width: number | null;
  height: number | null;
  alt: string;
}

/** `internal`: a storefront path, shown in the current language. `external`: an https address. */
export type PromoLink = { kind: "internal"; href: string } | { kind: "external"; href: string };

export interface Promotion {
  id: string;
  placement: PromoPlacement;
  /** The message (announcement, mini-ad) or the banner's text alternative. */
  text: string;
  image: PromoImage | null;
  link: PromoLink | null;
}

export interface Promotions {
  hero: Promotion[];
  announcements: Promotion[];
  mini: Promotion[];
}

export const emptyPromotions = (): Promotions => ({ hero: [], announcements: [], mini: [] });

/** Storefront paths ("/categories/x", not "//host") and https addresses; anything else is no link. */
export function toPromoLink(raw: unknown): PromoLink | null {
  if (typeof raw !== "string") return null;
  const href = raw.trim();
  if (/^\/(?![/\\])[^\s]*$/.test(href)) return { kind: "internal", href };
  if (/^https:\/\/[^\s/]+[^\s]*$/i.test(href)) {
    try {
      return new URL(href).protocol === "https:" ? { kind: "external", href } : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Split by placement, keeping order. A banner needs an image; a message needs text. */
export function groupPromotions(list: Promotion[]): Promotions {
  const out = emptyPromotions();
  for (const p of list) {
    if (p.placement === "hero") {
      if (p.image) out.hero.push(p);
    } else if (p.text.trim()) {
      (p.placement === "announcement" ? out.announcements : out.mini).push(p);
    }
  }
  return out;
}
