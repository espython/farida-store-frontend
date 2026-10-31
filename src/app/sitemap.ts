import type { MetadataRoute } from "next";
import { featuredCategories } from "@/modules/catalog";
import { listCategories, listProducts } from "@/modules/catalog/index.server";
import { LOCALES } from "@/shared/kernel/Locale";
import type { Locale } from "@/shared/kernel/Locale";
import { absoluteUrl } from "@/shared/lib/siteUrl";

export const revalidate = 3600;

const PAGE_SIZE = 100;
/** Safety stop: 50 pages of 100 is far beyond the shop's catalog. */
const MAX_PAGES = 50;

async function productSlugs(locale: Locale): Promise<string[]> {
  const slugs: string[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await listProducts({ locale, page, perPage: PAGE_SIZE, sort: "title" });
    slugs.push(...res.items.map((p) => p.slug));
    if (page >= res.totalPages) break;
  }
  return slugs;
}

async function catalogEntries(locale: Locale): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([listCategories(locale), productSlugs(locale)]);
  return [
    ...featuredCategories(categories).map((c) => ({
      url: absoluteUrl(`/${locale}/categories/${c.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((slug) => ({
      url: absoluteUrl(`/${locale}/product/${slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    { url: absoluteUrl(`/${locale}`), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl(`/${locale}/contact`), changeFrequency: "yearly", priority: 0.3 },
  ]);
  try {
    const catalog = await Promise.all(LOCALES.map(catalogEntries));
    return [...pages, ...catalog.flat()];
  } catch (err) {
    // Shop unreachable (or no keys at build time): serve the static pages, retry on revalidate.
    console.error("sitemap: catalog unavailable:", err instanceof Error ? err.message : err);
    return pages;
  }
}
