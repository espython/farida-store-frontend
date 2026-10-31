"use client";
import { buttonClass } from "@/shared/ui/Button";
import { formatAmount } from "@/shared/lib/price";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import React, { useContext } from "react";

const TotalPrice = () => {
  const { cart } = useContext(StoreContext);
  const router = useRouter();
  const t = useTranslations("cartPage");
  const currency = useTranslations("currency");

  const goToShipping = () => {
    router.push("/cart/shipping");
  };

  const row = "flex justify-between items-baseline gap-3";
  return (
    <section aria-labelledby="cart-summary" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <h2 id="cart-summary" className="font-display text-xl md:text-2xl capitalize">
        {t("cartHome.totlaPrice.totalItems")}
      </h2>
      <div className={row}>
        <span className="capitalize text-garden-muted">{t("cartHome.totlaPrice.items")}</span>
        <span className="font-semibold">
          {formatAmount(cart.totalPrice)} {currency("currency")}
        </span>
      </div>
      <div className={row}>
        <span className="capitalize text-garden-muted">{t("cartHome.totlaPrice.shipping")}</span>
        <span className="text-sm text-garden-muted">{t("cartHome.totlaPrice.notAvailable")}</span>
      </div>
      <div className={`${row} pt-4 border-t border-line`}>
        <span className="font-bold capitalize">{t("cartHome.totlaPrice.total")}</span>
        <span className="text-xl font-bold">
          {formatAmount(cart.totalPrice)} <span className="text-sm">{currency("currency")}</span>
        </span>
      </div>
      <button type="button" className={`${buttonClass({ size: "lg", full: true })} capitalize`} onClick={goToShipping}>
        {t("cartHome.totlaPrice.complete")}
      </button>
    </section>
  );
};

export default observer(TotalPrice);
