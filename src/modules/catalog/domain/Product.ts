import type { Locale } from "@/shared/kernel/Locale";
import type { Money } from "@/shared/kernel/Money";

export type StockLevel = "in_stock" | "low" | "out_of_stock";

export interface StockStatus {
  status: StockLevel;
  /** Only known when Woo reports a low-stock remainder. */
  quantity: number | null;
}

export interface ProductImage {
  id: number;
  src: string;
  thumbnail: string;
  alt: string;
}

export interface CategoryRef {
  id: string;
  slug: string;
  title: string;
}

export interface ProductAttribute {
  slug: string;
  name: string;
  terms: { slug: string; name: string }[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  sku: string;
  /** Price the shopper pays now (the sale price while on sale). */
  price: Money;
  /** Price before the sale, or null when the product is not on sale. */
  regularPrice: Money | null;
  stock: StockStatus;
  images: ProductImage[];
  categories: CategoryRef[];
  attributes: ProductAttribute[];
  rating: { average: number; count: number };
  locale: Locale;
}

export interface ProductPage {
  items: Product[];
  page: number;
  total: number;
  totalPages: number;
}
