"use client";
import { baseApi } from "@/shared/infrastructure/baseApi";
import type { Cart } from "../domain/cart";

type CartBody = { cart: Cart };

/**
 * The signed-in customer's saved cart (Store API through /api/shop/cart).
 * Every mutation answers with the whole cart, which replaces the cached one,
 * so there is no refetch after a change.
 */
export const cartApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    const writeBack = {
      async onQueryStarted(_arg: unknown, { dispatch, queryFulfilled }: { dispatch: (a: unknown) => unknown; queryFulfilled: Promise<{ data: Cart }> }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(cartApi.util.upsertQueryData("getServerCart", undefined, data));
        } catch {
          // The failed call is reported to the caller; the cached cart stays.
        }
      },
    };
    return {
      getServerCart: build.query<Cart, void>({
        query: () => "cart",
        transformResponse: (b: CartBody) => b.cart,
        providesTags: ["Cart"],
      }),
      addServerItem: build.mutation<Cart, { productId: string; quantity: number }>({
        query: (body) => ({ url: "cart/items", method: "POST", body }),
        transformResponse: (b: CartBody) => b.cart,
        ...writeBack,
      }),
      setServerQuantity: build.mutation<Cart, { productId: string; quantity: number }>({
        query: ({ productId, quantity }) => ({ url: `cart/items/${productId}`, method: "PATCH", body: { quantity } }),
        transformResponse: (b: CartBody) => b.cart,
        ...writeBack,
      }),
      removeServerItem: build.mutation<Cart, { productId: string }>({
        query: ({ productId }) => ({ url: `cart/items/${productId}`, method: "DELETE" }),
        transformResponse: (b: CartBody) => b.cart,
        ...writeBack,
      }),
      clearServerCart: build.mutation<Cart, void>({
        query: () => ({ url: "cart", method: "DELETE" }),
        transformResponse: (b: CartBody) => b.cart,
        ...writeBack,
      }),
      mergeGuestCart: build.mutation<{ cart: Cart; skipped: string[] }, { lines: { productId: string; quantity: number }[] }>({
        query: (body) => ({ url: "cart/merge", method: "POST", body }),
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(cartApi.util.upsertQueryData("getServerCart", undefined, data.cart));
          } catch {
            // Reported to the caller; the guest cart is kept for another try.
          }
        },
      }),
    };
  },
});
