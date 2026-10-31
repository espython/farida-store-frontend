"use client";
import { buttonClass } from "@/shared/ui/Button";
import { formatAmount } from "@/shared/lib/price";
import { StoreContext } from "@/contexts/StoreContext";
import { Button, Slider, SliderValue } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/navigation";
import React, { useContext, useEffect } from "react";

const PriceSlider = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const min_price = searchParams.get("min_price");
  const max_price = searchParams.get("max_price");
  const [value, setValue] = React.useState<SliderValue>([
    min_price ? Number(min_price) : 0,
    max_price ? Number(max_price) : 50000,
  ]);
  const { filter } = useContext(StoreContext);
  const t = useTranslations("filters");
  const currency = useTranslations("currency");

  const params = new URLSearchParams(searchParams.toString());

  // const salesOnly = searchParams.get("salesonly")

  const handlePriceSearch = (min: string, max: string) => {
    if (min && max) {
      params.set("min_price", min);
      params.set("max_price", max);
    } else {
      params.delete("min_price");
      params.delete("max_price");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const filterByPriceRange = () => {
    if (typeof value === "object") {
      // router.push(`${pathname}?min_price=${value[0] }&max_price=${value[1]}`)
      handlePriceSearch(value[0].toString(), value[1].toString());
    }
    filter.hideWholeFilterSidebar();
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <Slider
        label={t("selectPrice")}
        size="md"
        color="primary"
        step={10}
        maxValue={50000}
        minValue={0}
        value={value}
        onChange={setValue}
        classNames={{ label: "text-sm font-semibold text-garden", value: "text-sm text-garden-muted" }}
        getValue={() => ""}
      />
      <div className="flex items-center w-full justify-between gap-3">
        <p className="font-semibold" suppressHydrationWarning dir="ltr">
          {Array.isArray(value) && value.map((b) => formatAmount(b)).join(" – ")} {currency("currency")}
        </p>
        <button type="button" className={`${buttonClass({ variant: "outline" })} capitalize`} onClick={filterByPriceRange}>
          {t("select")}
        </button>
      </div>
    </div>
  );
};

export default PriceSlider;

