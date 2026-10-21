// Woo Store API shapes (wc/store/v1). Only the fields we read; never leave infrastructure/.
export interface WooPrices {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_minor_unit: number;
}

export interface WooStoreImage {
  id: number;
  src: string;
  thumbnail?: string;
  alt?: string;
}

export interface WooStoreProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  short_description?: string;
  description?: string;
  on_sale: boolean;
  prices: WooPrices;
  average_rating?: string;
  review_count?: number;
  images?: WooStoreImage[];
  categories?: { id: number; name: string; slug: string }[];
  attributes?: {
    name: string;
    taxonomy: string;
    terms?: { id: number; name: string; slug: string }[];
  }[];
  is_in_stock: boolean;
  low_stock_remaining?: number | null;
}

export interface WooStoreCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  image?: { src: string; alt?: string } | null;
}
