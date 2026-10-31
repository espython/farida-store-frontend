// The REST order fields the orders context reads (wc/v3/orders, consumer
// keys). Decimal strings, unlike the Store API. Never leave infrastructure/.
export interface WcAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  phone?: string;
}

export interface WcOrderLine {
  product_id: number;
  name: string;
  quantity: number;
  /** Before coupons; `total` is after. */
  subtotal: string;
  total: string;
  image?: { src?: string } | null;
}

export interface WcOrder {
  id: number;
  status: string;
  customer_id: number;
  currency: string;
  date_created: string;
  date_completed: string | null;
  payment_method: string;
  customer_note: string;
  total: string;
  shipping_total: string;
  discount_total: string;
  shipping: WcAddress;
  billing: WcAddress;
  line_items: WcOrderLine[];
}

/** The list asks only for these fields (`_fields`). */
export type WcOrderListItem = Pick<WcOrder, "id" | "status" | "currency" | "date_created" | "total" | "line_items">;

/** Store API product, only what the order page links with. */
export interface StoreProductRef {
  id: number;
  slug: string;
}
