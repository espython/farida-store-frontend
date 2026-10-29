"use client";
import { useTranslations } from "next-intl";

interface Props {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
}

/** − / count / + pill with labelled 44 px buttons (36 px in dense lists). */
const QuantityStepper = ({ value, onIncrement, onDecrement, min = 1, max, disabled, size = "md" }: Props) => {
  const t = useTranslations("quantity");
  const btn = `${size === "md" ? "w-11 h-11" : "w-9 h-9"} grid place-items-center rounded-full text-lg font-bold text-garden hover:bg-sand disabled:opacity-40 disabled:hover:bg-transparent`;

  return (
    <div className="inline-flex items-center bg-white border border-line rounded-full" role="group" aria-label={t("label")}>
      <button type="button" className={btn} onClick={onDecrement} disabled={disabled || value <= min} aria-label={t("decrease")}>
        −
      </button>
      <span className="min-w-[2rem] text-center font-bold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={onIncrement}
        disabled={disabled || (max !== undefined && value >= max)}
        aria-label={t("increase")}
      >
        +
      </button>
    </div>
  );
};

export default QuantityStepper;
