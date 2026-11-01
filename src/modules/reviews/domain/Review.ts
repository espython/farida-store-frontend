// Product reviews: what customers wrote, and the rules for writing one.
// Pure domain: no React, Redux, Next or Woo.

export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MIN_REVIEW_LENGTH = 10;
export const MAX_REVIEW_LENGTH = 2000;
export const REVIEWS_PER_PAGE = 10;

/** A published review, as anyone sees it. */
export interface Review {
  id: string;
  productId: string;
  /** Display name: first name and last initial ("Nour W."). */
  reviewer: string;
  rating: number;
  text: string;
  /** Written by someone who bought the product (Woo checks their orders). */
  verified: boolean;
  /** ISO date-time, UTC. */
  createdAt: string;
}

/** `pending`: waiting for the shop to approve it; only its author sees it. */
export type ReviewStatus = "pending" | "approved";

/** The signed-in customer's own review of a product, in any status. */
export interface MyReview extends Review {
  status: ReviewStatus;
}

export interface ReviewPage {
  items: Review[];
  page: number;
  total: number;
  totalPages: number;
}

export interface ReviewDraft {
  rating: number;
  text: string;
}

export type ReviewDraftError = "rating_required" | "text_too_short" | "text_too_long";

export type ReviewDraftErrors = Partial<Record<keyof ReviewDraft, ReviewDraftError>>;

export type ReviewDraftResult = { ok: true; draft: ReviewDraft } | { ok: false; errors: ReviewDraftErrors };

/** Whole stars 1–5 (Woo itself accepts 0 or 9) and 10–2000 characters of text. */
export function validateReviewDraft(input: { rating: unknown; text: unknown }): ReviewDraftResult {
  const errors: ReviewDraftErrors = {};
  const rating = input.rating;
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    errors.rating = "rating_required";
  }
  const text = cleanReviewText(typeof input.text === "string" ? input.text : "");
  const length = Array.from(text).length;
  if (length < MIN_REVIEW_LENGTH) errors.text = "text_too_short";
  else if (length > MAX_REVIEW_LENGTH) errors.text = "text_too_long";
  if (errors.rating || errors.text) return { ok: false, errors };
  return { ok: true, draft: { rating: rating as number, text } };
}

/** Trimmed, with runs of blank lines and trailing spaces collapsed. */
export function cleanReviewText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** "Nour Wahba" → "Nour W."; only the first name if there is no last name. */
export function reviewerName(firstName: string, lastName: string): string | null {
  const first = firstName.trim();
  const initial = Array.from(lastName.trim())[0];
  if (!first) return null;
  return initial ? `${first} ${initial.toUpperCase()}.` : first;
}

export const isProductId = (id: string) => /^[1-9]\d{0,9}$/.test(id);
