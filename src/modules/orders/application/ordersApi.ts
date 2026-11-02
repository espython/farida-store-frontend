"use client";
import { baseApi } from "@/shared/infrastructure/baseApi";
import type { Order, OrderPage } from "../domain/Order";
import type { ReturnRequest } from "../domain/ReturnRequest";

/** The signed-in customer's orders (/api/shop/orders), read from Woo. */
export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listOrders: build.query<OrderPage, number>({
      query: (page) => `orders?page=${page}`,
      transformResponse: (b: { orders: OrderPage }) => b.orders,
      providesTags: (r) => [{ type: "Order", id: "LIST" }, ...(r?.orders ?? []).map((o) => ({ type: "Order" as const, id: o.id }))],
    }),
    getOrder: build.query<Order, string>({
      query: (id) => `orders/${encodeURIComponent(id)}`,
      transformResponse: (b: { order: Order }) => b.order,
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    // Both answer with the changed order: it replaces the cached one at once,
    // and the list (which shows the status) is read again.
    cancelOrder: build.mutation<Order, string>({
      query: (id) => ({ url: `orders/${encodeURIComponent(id)}/cancel`, method: "POST" }),
      transformResponse: (b: { order: Order }) => b.order,
      onQueryStarted: (id, { dispatch, queryFulfilled }) => replaceCached(id, dispatch, queryFulfilled),
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),
    requestReturn: build.mutation<Order, { id: string } & ReturnRequest>({
      query: ({ id, ...body }) => ({ url: `orders/${encodeURIComponent(id)}/return`, method: "POST", body }),
      transformResponse: (b: { order: Order }) => b.order,
      onQueryStarted: ({ id }, { dispatch, queryFulfilled }) => replaceCached(id, dispatch, queryFulfilled),
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),
  }),
});

async function replaceCached(id: string, dispatch: (a: unknown) => unknown, done: Promise<{ data: Order }>) {
  try {
    const { data } = await done;
    dispatch(ordersApi.util.upsertQueryData("getOrder", id, data));
  } catch {
    // The hook reports the failure.
  }
}
