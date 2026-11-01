"use client";
import { baseApi } from "@/shared/infrastructure/baseApi";
import type { MyReview, ReviewDraft, ReviewPage } from "../domain/Review";

/** Whose review: the customer id keys the cache, so another sign-in never sees it. */
export type MyReviewArg = { productId: string; customerId: string };

/** Product reviews (/api/shop/reviews): the public list, and the customer's own. */
export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProductReviews: build.infiniteQuery<ReviewPage, string, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last, _all, lastParam) => (last.page < last.totalPages ? lastParam + 1 : undefined),
      },
      query: ({ queryArg, pageParam }) => ({ url: "reviews", params: { productId: queryArg, page: pageParam } }),
      providesTags: (_r, _e, productId) => [{ type: "Review", id: productId }],
    }),
    getMyReview: build.query<MyReview | null, MyReviewArg>({
      query: ({ productId }) => ({ url: "reviews/mine", params: { productId } }),
      transformResponse: (b: { review: MyReview | null }) => b.review,
      providesTags: (_r, _e, { productId }) => [{ type: "Review", id: `mine-${productId}` }],
    }),
    postReview: build.mutation<MyReview, MyReviewArg & ReviewDraft>({
      query: ({ productId, rating, text }) => ({ url: "reviews", method: "POST", body: { productId, rating, text } }),
      transformResponse: (b: { review: MyReview }) => b.review,
      async onQueryStarted({ productId, customerId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(reviewsApi.util.upsertQueryData("getMyReview", { productId, customerId }, data));
        } catch {
          // The form reports the failure.
        }
      },
    }),
  }),
});
