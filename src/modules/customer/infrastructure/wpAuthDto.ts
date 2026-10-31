// WordPress / Woo auth shapes. Only the fields we read; never leave infrastructure/.

/** POST /jwt-auth/v1/token (JWT Authentication for WP REST API). */
export interface WpTokenResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

/** Claims inside the plugin's HS256 token. */
export interface WpJwtPayload {
  iss: string;
  iat: number;
  nbf?: number;
  exp: number;
  data: { user: { id: string | number } };
}

/** GET /wp/v2/users/me?context=edit with the customer's own token. */
export interface WpUserMe {
  id: number;
  /** WordPress display name; defaults to the (random, internal) username. */
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

/** POST /wc/v3/customers request (registration). */
export interface WooCustomerCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username: string;
}

/** POST /wc/v3/customers response, the part we read. */
export interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

/** Error body from WP / Woo / the JWT plugin. */
export interface WpErrorBody {
  code?: string;
  message?: string;
}
