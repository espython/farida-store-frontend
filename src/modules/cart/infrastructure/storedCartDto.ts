// Persisted guest-cart shape (localStorage). Versioned and deliberately not the
// domain type: renaming a domain field must not break carts already saved in
// shoppers' browsers. Never leaves infrastructure/.
export interface StoredCartLineV1 {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  /** EGP minor units. */
  price: number;
  regularPrice: number | null;
  maxQty: number | null;
  qty: number;
}

export interface StoredCartV1 {
  v: 1;
  lines: StoredCartLineV1[];
}
