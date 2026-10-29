"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";

import { useRouter } from "@/navigation";
import React, { useContext } from "react";
import { buttonClass } from "@/shared/ui/Button";
import { formatAmount } from "@/shared/lib/price";

const CartDropTotalPrice = () => {
  const router = useRouter();
  const { cart } = useContext(StoreContext);
  const t = useTranslations("cartDrop");
  const currency = useTranslations("currency");

  const goToCartPage = () => {
    router.push("/cart");
  };
  const goToShippingSection = () => {
    router.push("/cart/shipping");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <p className="text-lg capitalize">{t("total")}</p>
        <p className="text-xl font-bold">
          {formatAmount(cart.totalPrice)} <span className="text-sm">{currency("currency")}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={`${buttonClass({ variant: "outline" })} capitalize px-3`} onClick={goToCartPage}>
          {t("go")}
        </button>
        <button type="button" className={`${buttonClass()} capitalize px-3`} onClick={goToShippingSection}>
          {t("complete")}
        </button>
      </div>
    </div>
  );
};

export default observer(CartDropTotalPrice);
