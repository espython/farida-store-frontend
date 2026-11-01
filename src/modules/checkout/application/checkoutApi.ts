"use client";
import { baseApi } from "@/shared/infrastructure/baseApi";
import type { Address } from "@/shared/kernel/Address";
import type { Checkout, PaymentMethod } from "../domain/Checkout";

type Body = { checkout: Checkout };

/** The signed-in customer's checkout (/api/shop/checkout). */
export const checkoutApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    // Every step answers with the whole checkout, which replaces the cached one.
    const writeBack = {
      async onQueryStarted(_arg: unknown, { dispatch, queryFulfilled }: { dispatch: (a: unknown) => unknown; queryFulfilled: Promise<{ data: Checkout }> }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(checkoutApi.util.upsertQueryData("getCheckout", undefined, data));
        } catch {
          // The caller shows the error; the cached checkout stays.
        }
      },
    };
    return {
      getCheckout: build.query<Checkout, void>({
        query: () => "checkout",
        transformResponse: (b: Body) => b.checkout,
        providesTags: ["Checkout"],
      }),
      saveAddress: build.mutation<Checkout, Address>({
        query: (address) => ({ url: "checkout/address", method: "PUT", body: { address } }),
        transformResponse: (b: Body) => b.checkout,
        ...writeBack,
      }),
      chooseShippingRate: build.mutation<Checkout, string>({
        query: (rateId) => ({ url: "checkout/shipping-rate", method: "PUT", body: { rateId } }),
        transformResponse: (b: Body) => b.checkout,
        ...writeBack,
      }),
      applyCoupon: build.mutation<Checkout, string>({
        query: (code) => ({ url: "checkout/coupon", method: "POST", body: { code } }),
        transformResponse: (b: Body) => b.checkout,
        ...writeBack,
      }),
      removeCoupon: build.mutation<Checkout, string>({
        query: (code) => ({ url: "checkout/coupon", method: "DELETE", body: { code } }),
        transformResponse: (b: Body) => b.checkout,
        ...writeBack,
      }),
      placeOrder: build.mutation<{ orderId: string; status: string }, { paymentMethod: PaymentMethod; note: string; key: string }>({
        query: ({ key, ...body }) => ({ url: "checkout/order", method: "POST", body, headers: { "Idempotency-Key": key } }),
        // The saved cart is empty now and the order list has a new order.
        invalidatesTags: ["Cart", "Checkout", { type: "Order", id: "LIST" }],
      }),
    };
  },
});
