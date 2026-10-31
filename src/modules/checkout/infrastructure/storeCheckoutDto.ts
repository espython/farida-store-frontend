// Store API cart fields the checkout reads (wc/store/v1/cart). Never leave infrastructure/.
export interface StoreAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email?: string;
}

export interface StoreShippingPackage {
  package_id: number | string;
  shipping_rates: { rate_id: string; name: string; price: string; currency_minor_unit: number; selected: boolean }[];
}

export interface StoreCheckoutCart {
  items: unknown[];
  shipping_address: StoreAddress;
  billing_address: StoreAddress;
  shipping_rates: StoreShippingPackage[];
  coupons: { code: string; totals: { total_discount: string; currency_minor_unit: number } }[];
  payment_methods: string[];
  totals: {
    total_items: string;
    total_shipping: string | null;
    total_discount: string;
    total_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
}

/** POST /wc/store/v1/checkout response. */
export interface StoreCheckoutResult {
  order_id: number;
  status: string;
  order_key: string;
  payment_method: string;
}
