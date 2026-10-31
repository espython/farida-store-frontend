import { useTranslations } from "next-intl";
import { formatAmount } from "@/shared/lib/price";
import React from "react";

type size =
  | "text-[1rem]"
  | "text-sm"
  | "text-lg"
  | "text-xl"
  | "text-2xl"
  | "text-3xl"
  | "text-4xl"
  | "text-5xl"
  | "text-6xl"
  | "text-7xl"
  | "text-8xl"
  | "text-9xl";

interface detailsProps {
  title: string;
  price: number;
  titleStyle?: string;
  priceStyle?: string;
  titleSize?: size;
  priceSize?: size;
}

const ShippingRowDetails = ({
  title,
  price,
  titleStyle,
  priceStyle,
  titleSize = "text-[1rem]",
  priceSize = "text-lg",
}: detailsProps) => {
  const currency = useTranslations("currency");

  return (
    <div className="flex gap-6 items-baseline justify-between">
      <span className={`capitalize ${titleStyle ?? "text-garden-muted"}`}>{title}</span>
      <span className={priceStyle ?? "font-semibold"}>
        {formatAmount(price)} <span className="text-sm">{currency("currency")}</span>
      </span>
    </div>
  );
};

export default ShippingRowDetails;
