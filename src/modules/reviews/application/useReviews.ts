"use client";
import { useCallback, useMemo } from "react";
import { useSession } from "@/modules/customer";
import { validateReviewDraft, type MyReview, type Review, type ReviewDraftErrors } from "../domain/Review";
import { reviewsApi } from "./reviewsApi";

/** A product's approved reviews, newest first, a page at a time. */
export const useProductReviews = (productId: string) => {
  const q = reviewsApi.useGetProductReviewsInfiniteQuery(productId);
  const reviews = useMemo<Review[]>(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return {
    reviews,
    total: q.data?.pages[0]?.total ?? 0,
    isLoading: q.isLoading,
    isError: q.isError && reviews.length === 0,
    hasMore: Boolean(q.hasNextPage),
    loadingMore: q.isFetchingNextPage,
    loadMore: q.fetchNextPage,
    retry: q.refetch,
  };
};

export type ReviewSubmitResult =
  | { ok: true }
  | { ok: false; code: "invalid"; errors: ReviewDraftErrors }
  | { ok: false; code: "already_reviewed" | "unavailable" };

/**
 * Writing a review. Guests are asked to sign in; a signed-in customer sees
 * their own review (waiting for approval or published) instead of the form
 * once they have written one.
 */
export const useMyReview = (productId: string) => {
  const { session, status } = useSession();
  const customerId = session?.customerId ?? "";
  const arg = { productId, customerId };
  const mine = reviewsApi.useGetMyReviewQuery(arg, { skip: status !== "signedIn" });
  const [post, postState] = reviewsApi.usePostReviewMutation();

  const submit = useCallback(
    async (input: { rating: number; text: string }): Promise<ReviewSubmitResult> => {
      const draft = validateReviewDraft(input);
      if (!draft.ok) return { ok: false, code: "invalid", errors: draft.errors };
      try {
        await post({ productId, customerId, ...draft.draft }).unwrap();
        return { ok: true };
      } catch (error) {
        const body = (error as { data?: { error?: { code?: string; details?: ReviewDraftErrors } } })?.data?.error;
        if (body?.code === "invalid_review") return { ok: false, code: "invalid", errors: body.details ?? {} };
        if (body?.code === "already_reviewed") {
          mine.refetch();
          return { ok: false, code: "already_reviewed" };
        }
        return { ok: false, code: "unavailable" };
      }
    },
    [post, productId, customerId, mine]
  );

  const review: MyReview | null = status === "signedIn" ? mine.data ?? null : null;
  return {
    status: status === "signedIn" ? (mine.isLoading ? "loading" : "signedIn") : status,
    review,
    submit,
    submitting: postState.isLoading,
  } as const;
};
