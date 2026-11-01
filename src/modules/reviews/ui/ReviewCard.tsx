"use client";
import { useLocale, useTranslations } from "next-intl";
import { HiCheckBadge } from "react-icons/hi2";
import Badge from "@/shared/ui/Badge";
import type { Review } from "../domain/Review";
import Stars from "./Stars";

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

/** One published review: stars, author, date, verified-buyer badge, text. */
const ReviewCard = ({ review }: { review: Review }) => {
  const t = useTranslations("reviews");
  const locale = useLocale();
  return (
    <article className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span role="img" aria-label={t("stars", { rating: review.rating })}>
          <Stars rating={review.rating} />
        </span>
        {review.verified && (
          <Badge tone="success">
            <HiCheckBadge aria-hidden="true" />
            {t("verified")}
          </Badge>
        )}
      </div>
      {/* dir="auto": a review keeps its own direction (Arabic text on the English page, and back). */}
      <p dir="auto" className="whitespace-pre-line leading-relaxed break-words">
        {review.text}
      </p>
      <p className="text-sm text-garden-muted">
        <bdi className="font-semibold text-garden">{review.reviewer}</bdi>
        {" · "}
        <time dateTime={review.createdAt}>{formatDate(review.createdAt, locale)}</time>
      </p>
    </article>
  );
};

export default ReviewCard;
