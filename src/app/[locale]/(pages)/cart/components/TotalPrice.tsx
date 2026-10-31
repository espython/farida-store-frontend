"use client";
import { buttonClass } from "@/shared/ui/Button";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import React from "react";
import { CartSummary, useCart } from "@/modules/cart";

const TotalPrice = () => {
  const { totals } = useCart();
  const router = useRouter();
  const t = useTranslations("cartPage");

  return (
    <section aria-labelledby="cart-summary" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <h2 id="cart-summary" className="font-display text-xl md:text-2xl capitalize">
        {t("cartHome.totlaPrice.totalItems")}
      </h2>
      <CartSummary totals={totals} />
      <button
        type="button"
        className={`${buttonClass({ size: "lg", full: true })} capitalize`}
        onClick={() => router.push("/cart/shipping")}
      >
        {t("cartHome.totlaPrice.complete")}
      </button>
    </section>
  );
};

export default TotalPrice;
