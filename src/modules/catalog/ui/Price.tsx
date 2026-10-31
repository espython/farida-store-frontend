"use client";
import { useTranslations } from "next-intl";
import { Money } from "@/shared/kernel/Money";

const SIZES = {
  sm: { now: "text-base", was: "text-sm" },
  md: { now: "text-xl", was: "text-sm" },
  lg: { now: "text-[1.75rem] md:text-[2rem]", was: "text-base md:text-lg" },
};

/** Current price (bold, with currency) and the struck regular price while on sale. */
const Price = ({ price, regularPrice, size = "md" }: { price: Money; regularPrice?: Money | null; size?: keyof typeof SIZES }) => {
  const currency = useTranslations("currency");
  const s = SIZES[size];
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={`${s.now} font-bold`}>
        {Money.toDisplay(price)} <span className="text-sm font-semibold">{currency("currency")}</span>
      </span>
      {regularPrice && (
        <span className={`${s.was} text-garden-muted line-through`}>{Money.toDisplay(regularPrice)}</span>
      )}
    </span>
  );
};

export default Price;
