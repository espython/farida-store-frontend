"use client";
import { baseApi } from "@/shared/infrastructure/baseApi";
import type { Order, OrderPage } from "../domain/Order";

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
  }),
});
