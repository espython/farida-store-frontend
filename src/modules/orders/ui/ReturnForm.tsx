"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Button from "@/shared/ui/Button";
import {
  MAX_RETURN_DETAILS_LENGTH,
  MIN_OTHER_DETAILS_LENGTH,
  RETURN_REASONS,
  type ReturnReason,
  type ReturnRequestErrors,
} from "../domain/ReturnRequest";
import type { ReturnResult } from "../application/useOrderActions";

interface Props {
  submit: (input: { reason: string; details: string }) => Promise<ReturnResult>;
  submitting: boolean;
  onCancel: () => void;
}

/** The reason (a radio group) and optional details. Errors show under each field. */
const ReturnForm = ({ submit, submitting, onCancel }: Props) => {
  const t = useTranslations("orders.actions.return");
  const id = useId();
  const [reason, setReason] = useState<ReturnReason | "">("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<ReturnRequestErrors>({});
  const [failure, setFailure] = useState<"not_returnable" | "unavailable" | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => firstRef.current?.focus(), []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFailure(null);
    const result = await submit({ reason, details });
    if (result.ok) return;
    if (result.code === "invalid") setErrors(result.errors);
    else setFailure(result.code);
  };

  const errorText = (field: keyof ReturnRequestErrors) => {
    const code = errors[field];
    return code ? t(`errors.${code}`, { min: MIN_OTHER_DETAILS_LENGTH, max: MAX_RETURN_DETAILS_LENGTH }) : null;
  };
  const reasonError = errorText("reason");
  const detailsError = errorText("details");
  const length = Array.from(details.trim()).length;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2" aria-describedby={reasonError ? `${id}-reason-error` : undefined}>
        <legend className="text-sm font-semibold mb-1">{t("reason")}</legend>
        {RETURN_REASONS.map((r, i) => (
          <label
            key={r}
            className={`flex items-center gap-3 min-h-[2.75rem] px-4 rounded-xl border cursor-pointer focus-within:ring-2 focus-within:ring-garden/30 ${
              reason === r ? "border-garden bg-sand" : "border-garden/20"
            }`}
          >
            <input
              ref={i === 0 ? firstRef : undefined}
              type="radio"
              name={`${id}-reason`}
              value={r}
              checked={reason === r}
              onChange={() => {
                setReason(r);
                setErrors((e) => ({ ...e, reason: undefined }));
              }}
              className="w-4 h-4 accent-garden"
            />
            <span>{t(`reasons.${r}`)}</span>
          </label>
        ))}
        {reasonError && (
          <p id={`${id}-reason-error`} className="text-sm text-[#b42318]">
            {reasonError}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-details`} className="text-sm font-semibold">
          {reason === "other" ? t("detailsRequired") : t("details")}
        </label>
        <textarea
          id={`${id}-details`}
          dir="auto"
          rows={4}
          value={details}
          maxLength={MAX_RETURN_DETAILS_LENGTH + 200}
          onChange={(e) => {
            setDetails(e.target.value);
            if (errors.details) setErrors((x) => ({ ...x, details: undefined }));
          }}
          aria-invalid={Boolean(detailsError)}
          aria-describedby={`${id}-details-hint${detailsError ? ` ${id}-details-error` : ""}`}
          className={`w-full rounded-xl bg-white border px-4 py-3 text-base text-garden outline-none focus:border-garden focus:ring-2 focus:ring-garden/20 resize-y ${
            detailsError ? "border-[#b42318]" : "border-garden/20"
          }`}
        />
        <p id={`${id}-details-hint`} className="flex justify-between gap-3 text-sm text-garden-muted">
          <span>{t("hint")}</span>
          <span className={length > MAX_RETURN_DETAILS_LENGTH ? "text-[#b42318]" : ""}>
            <bdi>
              {length}/{MAX_RETURN_DETAILS_LENGTH}
            </bdi>
          </span>
        </p>
        {detailsError && (
          <p id={`${id}-details-error`} className="text-sm text-[#b42318]">
            {detailsError}
          </p>
        )}
      </div>

      {failure && (
        <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
          {t(`errors.${failure}`)}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? t("submitting") : t("submit")}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          {t("back")}
        </Button>
      </div>
    </form>
  );
};

export default ReturnForm;
