"use client";

import React, { useContext } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { StoreContext } from "@/contexts/StoreContext";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CartLineItem, CartSummary, useCart } from "@/modules/cart";
import { buttonClass } from "@/shared/ui/Button";
import EmptyCartDrop from "./EmptyCartDrop";

/** Hover dropdown under the header cart icon (desktop). */
const CartDrop2 = () => {
  const { cart: cartUi } = useContext(StoreContext);
  const { lines, totals } = useCart();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("cartDrop");

  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{
        scaleY: cartUi.isCartMenuDisplayed ? 1 : 0,
        opacity: cartUi.isCartMenuDisplayed ? 1 : 0,
      }}
      className="origin-top w-[25rem] p-5 hidden md:block text-garden absolute top-full end-0 z-[100] bg-white rounded-3xl shadow-xl border border-line"
      dir={locale === "en" ? "ltr" : "rtl"}
    >
      <div className="flex flex-col gap-5">
        <p className="font-display text-xl capitalize">
          {t("cart")} <span className="text-garden-muted">({totals.itemCount})</span>
        </p>

        {lines.length === 0 ? (
          <EmptyCartDrop />
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-line max-h-[45vh] overflow-y-auto overflow-x-hidden">
              {lines.map((line) => (
                <li key={line.product.id} className="py-3 first:pt-0">
                  <CartLineItem line={line} variant="compact" onNavigate={cartUi.hideCartMenu} />
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t border-line flex flex-col gap-4">
              <CartSummary totals={totals} compact />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={`${buttonClass({ variant: "outline" })} capitalize px-3`} onClick={() => router.push("/cart")}>
                  {t("go")}
                </button>
                <button type="button" className={`${buttonClass()} capitalize px-3`} onClick={() => router.push("/cart/shipping")}>
                  {t("complete")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default observer(CartDrop2);
