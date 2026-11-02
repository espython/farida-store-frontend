"use client";
import { baseApi } from "@/shared/infrastructure/baseApi";
import type { Locale } from "@/shared/kernel/Locale";
import type { Promotions } from "../domain/Promotion";

/** The shop's promotions for one language (/api/shop/promotions). */
export const contentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPromotions: build.query<Promotions, Locale>({
      query: (locale) => ({ url: "promotions", params: { locale } }),
      providesTags: (_r, _e, locale) => [{ type: "Content", id: `promotions-${locale}` }],
      // Content changes rarely; one fetch per language per visit is plenty.
      keepUnusedDataFor: 600,
    }),
  }),
});
