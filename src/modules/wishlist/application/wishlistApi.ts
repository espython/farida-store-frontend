"use client";
import { baseApi } from "@/shared/infrastructure/baseApi";
import type { Wishlist } from "../domain/Wishlist";

type Body = { wishlist: Wishlist };

/** A signed-in customer's saved wishlist (/api/shop/wishlist). Each change answers with the whole list. */
export const wishlistApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    const change = <A>(query: (arg: A) => { url: string; method: string; body?: unknown }) =>
      build.mutation<Wishlist, A>({
        query,
        transformResponse: (b: Body) => b.wishlist,
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(wishlistApi.util.upsertQueryData("getWishlist", undefined, data));
          } catch {
            // The caller reports the failure; the cached list is unchanged.
          }
        },
      });
    return {
      getWishlist: build.query<Wishlist, void>({
        query: () => "wishlist",
        transformResponse: (b: Body) => b.wishlist,
        providesTags: [{ type: "Wishlist", id: "MINE" }],
      }),
      saveToWishlist: change((productId: string) => ({ url: `wishlist/items/${encodeURIComponent(productId)}`, method: "PUT" })),
      removeFromWishlist: change((productId: string) => ({ url: `wishlist/items/${encodeURIComponent(productId)}`, method: "DELETE" })),
      mergeGuestWishlist: build.mutation<{ wishlist: Wishlist; skipped: number }, string[]>({
        query: (productIds) => ({ url: "wishlist/merge", method: "POST", body: { productIds } }),
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(wishlistApi.util.upsertQueryData("getWishlist", undefined, data.wishlist));
          } catch {
            // Kept in the browser; retried on the next page load.
          }
        },
      }),
    };
  },
});
