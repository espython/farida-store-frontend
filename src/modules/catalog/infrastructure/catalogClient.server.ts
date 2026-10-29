import { AppError } from "@/shared/kernel/AppError";
import type { Locale } from "@/shared/kernel/Locale";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import type { Category } from "../domain/Category";
import type { Color } from "../domain/Color";
import type { ProductSort } from "../domain/ProductSort";
import type { Product, ProductPage } from "../domain/Product";
import { toCategory, toColor, toProduct } from "./productMapper";
import type {
  WooStoreAttribute,
  WooStoreCategory,
  WooStoreProduct,
  WooStoreTerm,
} from "./wooProductDto";

export interface ProductQuery {
  locale: Locale;
  page: number;
  perPage: number;
  sort: ProductSort;
  /** Category slug. */
  category?: string;
  /** Minor units (piastres). */
  minPrice?: number;
  maxPrice?: number;
  /** Colour term slug of the pa_color attribute. */
  color?: string;
  onSale?: boolean;
  search?: string;
}

const SORT: Record<ProductSort, { orderby: string; order: "asc" | "desc" }> = {
  newest: { orderby: "date", order: "desc" },
  price_asc: { orderby: "price", order: "asc" },
  price_desc: { orderby: "price", order: "desc" },
  popularity: { orderby: "popularity", order: "desc" },
  rating: { orderby: "rating", order: "desc" },
  title: { orderby: "title", order: "asc" },
};

/** Fetch-cache tag on every Woo catalog read; `/api/revalidate` clears it on product webhooks. */
export const CATALOG_CACHE_TAG = "catalog";
const CATALOG_CACHE = { revalidate: 60, tags: [CATALOG_CACHE_TAG] };

// Woo stores Arabic slugs percent-encoded; compare them decoded.
const safeDecode = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
};
const normalizeSlug = (slug: string) => safeDecode(slug).toLowerCase();

const intHeader = (headers: Headers, name: string, fallback: number) => {
  const n = Number.parseInt(headers.get(name) ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
};

export async function listCategories(locale: Locale): Promise<Category[]> {
  const res = await wooFetch<WooStoreCategory[]>({
    path: "/wc/store/v1/products/categories",
    query: { per_page: 100, lang: locale },
    next: CATALOG_CACHE,
  });
  return res.data.map((c) => toCategory(c, locale));
}

export async function listColors(locale: Locale): Promise<Color[]> {
  const attributes = await wooFetch<WooStoreAttribute[]>({
    path: "/wc/store/v1/products/attributes",
    next: CATALOG_CACHE,
  });
  const color = attributes.data.find((a) => a.taxonomy === "pa_color");
  if (!color) return [];
  const terms = await wooFetch<WooStoreTerm[]>({
    path: `/wc/store/v1/products/attributes/${color.id}/terms`,
    query: { per_page: 100, lang: locale },
    next: CATALOG_CACHE,
  });
  return terms.data.map((t) => toColor(t, locale));
}

export async function listProducts(q: ProductQuery): Promise<ProductPage> {
  const sort = SORT[q.sort];
  const query: Record<string, string | number | undefined> = {
    page: q.page,
    per_page: q.perPage,
    orderby: sort.orderby,
    order: sort.order,
    // The Store API takes a category slug; an unknown slug yields an empty page.
    category: q.category,
    min_price: q.minPrice,
    max_price: q.maxPrice,
    // Woo stores titles HTML-escaped ("Pots &amp; Pans") and matches the phrase as typed.
    on_sale: q.onSale ? "true" : undefined,
    search: q.search?.replace(/&/g, "&amp;"),
    // Hidden products must not show up in listings; search results use the search flag.
    catalog_visibility: q.search ? "search" : "catalog",
    lang: q.locale,
  };
  if (q.color) {
    query["attributes[0][attribute]"] = "pa_color";
    query["attributes[0][slug]"] = q.color;
  }

  const res = await wooFetch<WooStoreProduct[]>({
    path: "/wc/store/v1/products",
    query,
    next: CATALOG_CACHE,
  });

  return {
    items: res.data.map((p) => toProduct(p, q.locale)),
    page: q.page,
    total: intHeader(res.headers, "x-wp-total", res.data.length),
    totalPages: intHeader(res.headers, "x-wp-totalpages", 1),
  };
}

export async function getProductBySlug(slug: string, locale: Locale): Promise<Product> {
  // The collection's ?slug= filter does not match percent-encoded Arabic slugs;
  // the single-product route accepts an id or a slug (either hex case) and 404s drafts.
  const res = await wooFetch<WooStoreProduct>({
    path: `/wc/store/v1/products/${encodeURIComponent(safeDecode(slug))}`,
    query: { lang: locale },
    next: CATALOG_CACHE,
  });
  // Numeric slugs would resolve by id upstream; only accept a real slug match.
  if (normalizeSlug(res.data.slug) !== normalizeSlug(slug)) {
    throw new AppError("not_found", "Product not found", 404);
  }
  return toProduct(res.data, locale);
}
