"use client";
import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { FaRegStar, FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import Button from "@/shared/ui/Button";
import { MAX_REVIEW_LENGTH, MIN_REVIEW_LENGTH, MAX_RATING, type ReviewDraftErrors } from "../domain/Review";
import type { ReviewSubmitResult } from "../application/useReviews";

interface Props {
  submit: (input: { rating: number; text: string }) => Promise<ReviewSubmitResult>;
  submitting: boolean;
}

/** Stars (a radio group) and the text. Errors show under each field. */
const ReviewForm = ({ submit, submitting }: Props) => {
  const t = useTranslations("reviews.form");
  const id = useId();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<ReviewDraftErrors>({});
  const [failure, setFailure] = useState<"already_reviewed" | "unavailable" | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFailure(null);
    const result = await submit({ rating, text });
    if (result.ok) {
      setErrors({});
      toast.success(t("sent"), { toastId: "review-sent" });
      return;
    }
    if (result.code === "invalid") setErrors(result.errors);
    else setFailure(result.code);
  };

  const errorText = (field: keyof ReviewDraftErrors) => {
    const code = errors[field];
    return code ? t(`errors.${code}`, { min: MIN_REVIEW_LENGTH, max: MAX_REVIEW_LENGTH }) : null;
  };
  const ratingError = errorText("rating");
  const textError = errorText("text");
  const shown = hover || rating;
  const length = Array.from(text.trim()).length;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="font-display text-xl">
        {t("title")}
      </h3>

      <fieldset className="flex flex-col gap-1.5" aria-describedby={ratingError ? `${id}-rating-error` : undefined}>
        <legend className="text-sm font-semibold mb-1.5">{t("rating")}</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name={`${id}-rating`}
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setErrors((e) => ({ ...e, rating: undefined }));
                }}
                className="peer sr-only"
              />
              <span className="sr-only">{t("ratingOption", { count: n })}</span>
              <span
                aria-hidden="true"
                className="grid place-items-center w-11 h-11 rounded-full text-[1.625rem] text-saffron peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-garden"
              >
                {n <= shown ? <FaStar /> : <FaRegStar className="text-[#c9c5b0]" />}
              </span>
            </label>
          ))}
        </div>
        {ratingError && (
          <p id={`${id}-rating-error`} className="text-sm text-[#b42318]">
            {ratingError}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-text`} className="text-sm font-semibold">
          {t("text")}
        </label>
        <textarea
          id={`${id}-text`}
          dir="auto"
          rows={5}
          value={text}
          maxLength={MAX_REVIEW_LENGTH + 200}
          onChange={(e) => {
            setText(e.target.value);
            if (errors.text) setErrors((x) => ({ ...x, text: undefined }));
          }}
          aria-invalid={Boolean(textError)}
          aria-describedby={`${id}-text-hint${textError ? ` ${id}-text-error` : ""}`}
          className={`w-full rounded-xl bg-white border px-4 py-3 text-base text-garden outline-none focus:border-garden focus:ring-2 focus:ring-garden/20 resize-y ${
            textError ? "border-[#b42318]" : "border-garden/20"
          }`}
        />
        <p id={`${id}-text-hint`} className="flex justify-between gap-3 text-sm text-garden-muted">
          <span>{t("hint", { min: MIN_REVIEW_LENGTH })}</span>
          <span className={length > MAX_REVIEW_LENGTH ? "text-[#b42318]" : ""}>
            <bdi>
              {length}/{MAX_REVIEW_LENGTH}
            </bdi>
          </span>
        </p>
        {textError && (
          <p id={`${id}-text-error`} className="text-sm text-[#b42318]">
            {textError}
          </p>
        )}
      </div>

      {failure && (
        <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
          {t(`errors.${failure}`)}
        </p>
      )}

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
