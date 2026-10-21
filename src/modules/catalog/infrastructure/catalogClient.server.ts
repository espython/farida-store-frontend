import { AppError } from "@/shared/kernel/AppError";
import type { Locale } from "@/shared/kernel/Locale";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import type { Category } from "../domain/Category";
import type { Product, ProductPage } from "../domain/Product";
import { toCategory, toProduct } from "./productMapper";
import type { WooStoreCategory, WooStoreProduct } from "./wooProductDto";

export type ProductSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popularity"
  | "rating"
  | "title";

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

const CATALOG_CACHE = { revalidate: 60, tags: ["catalog"] };

// Woo stores Arabic slugs percent-encoded; compare them decoded.
const normalizeSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug).toLowerCase();
  } catch {
    return slug.toLowerCase();
  }
};

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
    search: q.search,
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
  const res = await wooFetch<WooStoreProduct[]>({
    path: "/wc/store/v1/products",
    query: { slug, per_page: 1, lang: locale },
    next: CATALOG_CACHE,
  });
  // Guard: if Woo ignored the slug filter we must not return an arbitrary product.
  const match = res.data.find((p) => normalizeSlug(p.slug) === normalizeSlug(slug));
  if (!match) throw new AppError("not_found", "Product not found", 404);
  return toProduct(match, locale);
}
