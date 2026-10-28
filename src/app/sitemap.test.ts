import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Category, Product } from "@/modules/catalog";

const state = vi.hoisted(() => ({
  source: "woo" as "woo" | "strapi",
  categories: [] as Partial<Category>[],
  pages: [] as Partial<Product>[][],
  fail: false,
}));

vi.mock("@/modules/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/catalog")>()),
  get CATALOG_SOURCE() {
    return state.source;
  },
}));
vi.mock("@/modules/catalog/index.server", () => ({
  listCategories: async () => {
    if (state.fail) throw new Error("down");
    return state.categories;
  },
  listProducts: async ({ page }: { page: number }) => ({
    items: state.pages[page - 1] ?? [],
    page,
    total: state.pages.flat().length,
    totalPages: state.pages.length,
  }),
}));
vi.mock("@/shared/lib/siteUrl", () => ({ absoluteUrl: (p: string) => `https://site.test${p}` }));

import sitemap from "./sitemap";

const urls = async () => (await sitemap()).map((e) => e.url);

beforeEach(() => {
  state.source = "woo";
  state.fail = false;
  state.categories = [
    { slug: "kettles", productCount: 3 },
    { slug: "empty", productCount: 0 },
    { slug: "uncategorized", productCount: 9 },
  ];
  state.pages = [[{ slug: "k1" }, { slug: "k2" }], [{ slug: "k3" }]];
});

describe("sitemap", () => {
  it("lists static pages, featured categories and every product page per locale", async () => {
    const list = await urls();
    for (const locale of ["en", "ar"]) {
      expect(list).toContain(`https://site.test/${locale}`);
      expect(list).toContain(`https://site.test/${locale}/categories/kettles`);
      for (const slug of ["k1", "k2", "k3"]) {
        expect(list).toContain(`https://site.test/${locale}/product/${slug}`);
      }
    }
    expect(list.some((u) => u.includes("empty") || u.includes("uncategorized"))).toBe(false);
  });

  it("keeps the static pages when the shop is down", async () => {
    state.fail = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await urls()).toEqual([
      "https://site.test/en",
      "https://site.test/en/contact",
      "https://site.test/ar",
      "https://site.test/ar/contact",
    ]);
  });

  it("skips the catalog on the Strapi source", async () => {
    state.source = "strapi";
    expect(await urls()).toHaveLength(4);
  });
});
