"use client";
import { useId } from "react";
import { useTranslations } from "next-intl";
import { LuMessageSquare } from "react-icons/lu";
import Rating from "@/components/Rating";
import { Link } from "@/navigation";
import Badge from "@/shared/ui/Badge";
import Button, { buttonClass } from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { useMyReview, useProductReviews } from "../application/useReviews";
import type { MyReview } from "../domain/Review";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import Stars from "./Stars";

interface Props {
  productId: string;
  /** The product's aggregate (Woo counts approved reviews only). */
  rating: { average: number; count: number };
}

/** The customer's own review: waiting for approval, or published. */
const OwnReview = ({ review }: { review: MyReview }) => {
  const tm = useTranslations("reviews.mine");
  const pending = review.status === "pending";
  return (
    <div role="status" className="flex flex-col gap-3 p-5 rounded-3xl bg-sand">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display text-lg">{pending ? tm("pendingTitle") : tm("approvedTitle")}</p>
        <Badge tone={pending ? "warning" : "success"}>{pending ? tm("pending") : tm("approved")}</Badge>
      </div>
      {pending && <p className="text-sm text-garden-muted">{tm("pendingText")}</p>}
      <Stars rating={review.rating} />
      <p dir="auto" className="whitespace-pre-line break-words line-clamp-6">
        {review.text}
      </p>
    </div>
  );
};

/** Write a review (signed in), or the way to sign in, or the customer's own review. */
const WriteReview = ({ productId }: { productId: string }) => {
  const t = useTranslations("reviews");
  const { status, review, submit, submitting } = useMyReview(productId);
  if (status === "loading") return <div className="h-40 rounded-3xl bg-sand/60 animate-pulse" aria-hidden="true" />;
  if (status === "signedOut") {
    return (
      <div className="flex flex-col items-start gap-3 p-5 rounded-3xl bg-sand">
        <p>{t("signIn.text")}</p>
        <Link href="/login" className={buttonClass({ variant: "outline" })}>
          {t("signIn.action")}
        </Link>
      </div>
    );
  }
  if (review) return <OwnReview review={review} />;
  return (
    <div className="p-5 md:p-6 rounded-3xl bg-white">
      <ReviewForm submit={submit} submitting={submitting} />
    </div>
  );
};

/** Product page reviews: the rating summary, writing a review, and the published reviews. */
const ProductReviews = ({ productId, rating }: Props) => {
  const t = useTranslations("reviews");
  const headingId = useId();
  const { reviews, total, isLoading, isError, hasMore, loadingMore, loadMore, retry } = useProductReviews(productId);
  const count = Math.max(rating.count, total);

  return (
    <section aria-labelledby={headingId} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
      <div className="lg:col-span-4 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 id={headingId} className="font-display text-2xl md:text-[2rem] font-medium">
            {t("title")}
          </h2>
          {count > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Rating rating={rating.average} />
              <span className="text-sm text-garden-muted">{t("summary", { count })}</span>
            </div>
          ) : (
            <p className="text-garden-muted">{t("none")}</p>
          )}
        </div>
        <WriteReview productId={productId} />
      </div>

      <div className="lg:col-span-8 flex flex-col gap-4" aria-busy={isLoading || loadingMore}>
        {isLoading ? (
          [0, 1].map((i) => <div key={i} className="h-36 rounded-3xl bg-white animate-pulse" aria-hidden="true" />)
        ) : isError ? (
          <EmptyState
            role="alert"
            title={t("error")}
            action={
              <Button variant="outline" onClick={() => retry()}>
                {t("retry")}
              </Button>
            }
          />
        ) : reviews.length === 0 ? (
          <EmptyState icon={<LuMessageSquare />} title={t("emptyTitle")} text={t("emptyText")} />
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {reviews.map((r) => (
                <li key={r.id}>
                  <ReviewCard review={r} />
                </li>
              ))}
            </ul>
            {hasMore && (
              <div>
                <Button variant="outline" onClick={() => loadMore()} disabled={loadingMore}>
                  {loadingMore ? t("loading") : t("more")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ProductReviews;
