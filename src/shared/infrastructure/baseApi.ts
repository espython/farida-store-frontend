import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

// All requests go through our own Next route handlers (the BFF), never to
// WordPress directly. Routes are added under /api/shop as endpoints migrate.
export const SHOP_API_BASE = "/api/shop";

// Cache tags used for invalidation. Add a tag here before using it in an api.
export const tagTypes = [
  "Product",
  "Category",
  "Cart",
  "Order",
  "Account",
  "Address",
  "Review",
  "Wishlist",
  "Content",
] as const;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: SHOP_API_BASE,
  credentials: "same-origin",
});

// Single place that reacts to an expired/invalid session on shop routes: clear
// the session cookies (/api/auth/logout), then send the user to the localized
// login. Auth routes use their own API slice (modules/customer), where a 401
// means "wrong password" or "not signed in".
const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && typeof window !== "undefined") {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // The redirect below still happens; middleware re-checks the cookie.
    }
    const locale = window.location.pathname.split("/")[1];
    const prefix = locale === "ar" || locale === "en" ? `/${locale}` : "/en";
    if (!window.location.pathname.endsWith("/login")) {
      window.location.assign(`${prefix}/login`);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "shopApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: [...tagTypes],
  endpoints: () => ({}),
});
