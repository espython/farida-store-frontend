// Woo Store API cart shapes (wc/store/v1/cart). Only the fields we read; never leave infrastructure/.
export interface StoreCartPrices {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_minor_unit: number;
}

export interface StoreCartItem {
  /** Woo's line key; update and remove go by key. */
  key: string;
  id: number;
  quantity: number;
  name: string;
  permalink: string;
  images?: { src: string; thumbnail?: string; alt?: string }[];
  prices: StoreCartPrices;
  quantity_limits: { minimum: number; maximum: number; multiple_of: number; editable: boolean };
}

export interface StoreCart {
  items: StoreCartItem[];
  items_count: number;
  totals: { total_items: string; total_price: string; currency_code: string; currency_minor_unit: number };
}
