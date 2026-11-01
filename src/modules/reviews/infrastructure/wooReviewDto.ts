// Woo's review shapes (only the fields we read).

/** Store API `wc/store/v1/products/reviews`: approved reviews only, no email. */
export interface StoreReviewDto {
  id: number;
  product_id: number;
  date_created_gmt?: string;
  reviewer?: string;
  /** HTML (filtered by WordPress, wrapped in <p>). */
  review?: string;
  rating?: number;
  verified?: boolean;
}

/** `wc/v3/products/reviews` (server keys): any status. */
export interface WcReviewDto extends StoreReviewDto {
  status?: string;
}
