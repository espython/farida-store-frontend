import type { Category } from "../domain/Category";
import type { Color } from "../domain/Color";

const norm = (slug: string) => {
  try {
    return decodeURIComponent(slug).toLowerCase();
  } catch {
    return slug.toLowerCase();
  }
};

/** Route segments and Woo slugs may differ in percent-encoding and case (Arabic slugs). */
export const sameSlug = (a: string | null | undefined, b: string | null | undefined): boolean =>
  !!a && !!b && norm(a) === norm(b);

export const findCategory = (
  categories: readonly Category[] | undefined,
  slug: string | null | undefined
): Category | undefined => categories?.find((c) => sameSlug(c.slug, slug));

export const findColor = (
  colors: readonly Color[] | undefined,
  slug: string | null | undefined
): Color | undefined => colors?.find((c) => sameSlug(c.slug, slug));

/** Categories worth showing in navigation: skips empty ones. */
export const visibleCategories = (categories: readonly Category[] | undefined): Category[] =>
  (categories ?? []).filter((c) => c.productCount > 0);

/** Woo's default bucket for products without a category; not a useful shortcut. */
const UNCATEGORIZED = "uncategorized";

/** Categories to promote (home slider, search shortcuts): non-empty, real ones, biggest first. */
export const featuredCategories = (categories: readonly Category[] | undefined): Category[] =>
  visibleCategories(categories)
    .filter((c) => c.slug !== UNCATEGORIZED)
    .sort((a, b) => b.productCount - a.productCount);

/** Fallback title from a slug when the category is not loaded yet or is unknown. */
export const titleFromSlug = (slug: string): string => {
  try {
    return decodeURIComponent(slug).replace(/[-_]+/g, " ").trim();
  } catch {
    return slug;
  }
};
