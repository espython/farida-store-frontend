import { baseApi } from "@/shared/infrastructure/baseApi";
import type { Locale } from "@/shared/kernel/Locale";
import type { Category } from "../domain/Category";
import type { Color } from "../domain/Color";
import type { Product, ProductPage } from "../domain/Product";
import type { ProductSort } from "../domain/ProductSort";

export interface ProductsArgs {
  locale: Locale;
  page?: number;
  perPage?: number;
  sort?: ProductSort;
  category?: string | null;
  color?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  onSale?: boolean;
  search?: string | null;
  /** Comma-separated product ids: only these, in this order. */
  ids?: string | null;
}

export interface SearchArgs {
  locale: Locale;
  q: string;
  page?: number;
  perPage?: number;
}

export interface ProductArgs {
  locale: Locale;
  slug: string;
}

/** Builds a stable query string: fixed key order, empty values dropped (cache keys depend on it). */
export function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const p = new URLSearchParams();
  for (const key of Object.keys(params).sort()) {
    const v = params[key];
    if (v === null || v === undefined || v === "" || v === false) continue;
    p.set(key, v === true ? "1" : String(v));
  }
  return p.toString();
}

export const productsQuery = (a: ProductsArgs) => `products?${buildQuery({ ...a })}`;
export const searchQuery = (a: SearchArgs) => `search?${buildQuery({ ...a })}`;
export const productQuery = (a: ProductArgs) =>
  `products/${encodeURIComponent(a.slug)}?${buildQuery({ locale: a.locale })}`;

const pageTags = (page: ProductPage | undefined) => [
  { type: "Product" as const, id: "LIST" },
  ...(page?.items ?? []).map((p) => ({ type: "Product" as const, id: p.id })),
];

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<ProductPage, ProductsArgs>({
      query: productsQuery,
      providesTags: (res) => pageTags(res),
    }),
    searchProducts: build.query<ProductPage, SearchArgs>({
      query: searchQuery,
      providesTags: (res) => pageTags(res),
    }),
    getProduct: build.query<Product, ProductArgs>({
      query: productQuery,
      providesTags: (res) => (res ? [{ type: "Product", id: res.id }] : []),
    }),
    getCategories: build.query<Category[], Locale>({
      query: (locale) => `categories?${buildQuery({ locale })}`,
      providesTags: [{ type: "Category", id: "LIST" }],
    }),
    getColors: build.query<Color[], Locale>({
      query: (locale) => `colors?${buildQuery({ locale })}`,
      providesTags: [{ type: "Category", id: "COLORS" }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useSearchProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
  useGetColorsQuery,
} = catalogApi;
