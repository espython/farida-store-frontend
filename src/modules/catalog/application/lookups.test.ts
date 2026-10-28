import { describe, expect, it } from "vitest";
import type { Category } from "../domain/Category";
import {
  featuredCategories,
  findCategory,
  findColor,
  sameSlug,
  titleFromSlug,
  visibleCategories,
} from "./lookups";

const cat = (slug: string, productCount = 1): Category => ({
  id: slug,
  slug,
  title: slug,
  parentId: null,
  productCount,
  image: null,
  locale: "en",
});

describe("slug lookups", () => {
  it("matches slugs regardless of percent-encoding and case", () => {
    expect(sameSlug("%D9%82%D8%AF%D8%B1", "%d9%82%d8%af%d8%b1")).toBe(true);
    expect(sameSlug("قدر", "%d9%82%d8%af%d8%b1")).toBe(true);
    expect(sameSlug("Cookware", "cookware")).toBe(true);
    expect(sameSlug("a", "b")).toBe(false);
    expect(sameSlug(null, "a")).toBe(false);
    expect(sameSlug("%E0%A4%A", "%e0%a4%a")).toBe(true);
  });

  it("finds categories and colours, and tolerates missing data", () => {
    expect(findCategory([cat("pots")], "POTS")?.id).toBe("pots");
    expect(findCategory(undefined, "pots")).toBeUndefined();
    expect(findCategory([cat("pots")], null)).toBeUndefined();
    const red = { id: "1", slug: "red", name: "Red", hex: null, locale: "en" as const };
    expect(findColor([red], "red")).toBe(red);
    expect(findColor([red], "blue")).toBeUndefined();
  });

  it("hides empty categories and builds a readable fallback title", () => {
    expect(visibleCategories([cat("a", 0), cat("b", 2)]).map((c) => c.slug)).toEqual(["b"]);
    expect(visibleCategories(undefined)).toEqual([]);
    expect(
      featuredCategories([cat("a", 1), cat("uncategorized", 9), cat("b", 0), cat("c", 4)]).map((c) => c.slug)
    ).toEqual(["c", "a"]);
    expect(titleFromSlug("pots-and_pans")).toBe("pots and pans");
    expect(titleFromSlug("%D9%82%D8%AF%D8%B1-%D8%B6%D8%BA%D8%B7")).toBe("قدر ضغط");
    expect(titleFromSlug("%E0%A4%A")).toBe("%E0%A4%A");
  });
});
