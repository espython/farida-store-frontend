import type { Locale } from "@/shared/kernel/Locale";
import type { ProductSort } from "../domain/ProductSort";
import type { ProductsArgs } from "./catalogApi";

type ParamsLike = { get(name: string): string | null };

// Existing filter controls write these values to the URL; links in the wild use them.
const LEGACY_SORT: Record<string, ProductSort> = {
  "": "popularity",
  rating: "rating",
  "createdAt:DESC": "newest",
  "price:ASC": "price_asc",
  "price:DESC": "price_desc",
};

const PAGE_SIZES = new Set([12, 16, 20, 24]);

const toInt = (raw: string | null, min: number, max: number): number | null => {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

const toSlug = (raw: string | null | undefined): string | null =>
  raw && raw.length <= 200 && !/[\s/\\?#]/.test(raw) && !raw.includes("..") ? raw : null;

/**
 * Turns the legacy filter URL (salesonly, min_price, max_price, color, sort, psize, q) plus the
 * category route segment into catalog query args. Invalid values fall back to defaults.
 */
export function legacyParamsToArgs(
  params: ParamsLike,
  opts: { locale: Locale; category?: string | null }
): ProductsArgs {
  const perPage = toInt(params.get("psize"), 1, 48);
  const search = (params.get("q") ?? "").trim().slice(0, 100);
  return {
    locale: opts.locale,
    perPage: perPage !== null && PAGE_SIZES.has(perPage) ? perPage : 12,
    sort: LEGACY_SORT[params.get("sort") ?? ""] ?? "popularity",
    category: toSlug(opts.category),
    color: toSlug(params.get("color")),
    minPrice: toInt(params.get("min_price"), 0, 10_000_000),
    maxPrice: toInt(params.get("max_price"), 1, 10_000_000),
    onSale: params.get("salesonly") === "true",
    search: search || null,
  };
}
