import { htmlToText } from "@/shared/lib/htmlText";
import { MAX_RATING, MIN_RATING, type MyReview, type Review } from "../domain/Review";
import type { StoreReviewDto, WcReviewDto } from "./wooReviewDto";

const clampRating = (n: unknown) => {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.min(MAX_RATING, Math.max(MIN_RATING, v));
};

/** Woo's GMT dates have no zone ("2026-11-01T21:46:55"). */
const utc = (date?: string) => {
  if (!date) return new Date(0).toISOString();
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(date) ? date : `${date}Z`);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
};

/** Reviews render as plain text: Woo's HTML is never put in the page. */
export function toReview(dto: StoreReviewDto): Review {
  return {
    id: String(dto.id),
    productId: String(dto.product_id),
    reviewer: htmlToText(dto.reviewer ?? "").trim() || "—",
    rating: clampRating(dto.rating),
    text: htmlToText(dto.review ?? ""),
    verified: dto.verified === true,
    createdAt: utc(dto.date_created_gmt),
  };
}

export function toMyReview(dto: WcReviewDto): MyReview {
  return { ...toReview(dto), status: dto.status === "approved" ? "approved" : "pending" };
}
