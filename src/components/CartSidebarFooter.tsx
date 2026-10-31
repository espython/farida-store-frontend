"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { buttonClass } from "@/shared/ui/Button";
import { formatAmount } from "@/shared/lib/price";
import { useRouter } from "@/navigation";
import React, { useContext, useEffect, useState } from "react";
import ConfirmMergeCart from "./ConfirmMergeCart";
import { isUserLoggedIn } from "@/functions/credentials";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";

const CartSidebarFooter = () => {
  const { cartSidebar, cart, user, loginForm, registerForm } =
    useContext(StoreContext);
  const { isLoggedIn } = useAuth();

  const router = useRouter();
  const t = useTranslations("cartSidebar");
  const currency = useTranslations("currency");

  const goToCartShippingPage = () => {
    router.push("/cart/shipping");
    cartSidebar.hideWholeCartSidebar();
  };

  useEffect(() => {
    if (isUserLoggedIn()) {
      cartSidebar.checkLocalCartHasItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user.isLoading,
    loginForm.isLoading,
    registerForm.isLoading,
    user.isMergingOrRemovingLoading,
  ]);

  return (
    <div className="shrink-0 border-t border-line bg-white">
      {isLoggedIn &&
        cartSidebar.isLocalCartHasItems &&
        !user.isMergingOrRemovingLoading && <ConfirmMergeCart />}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-baseline capitalize">
          <p className="text-lg">{t("total")}</p>
          <p className="font-bold text-xl">
            {formatAmount(cart.totalPrice)} <span className="text-sm">{currency("currency")}</span>
          </p>
        </div>
        {cart.productsCount > 0 && (
          <button type="button" className={`${buttonClass({ size: "lg", full: true })} capitalize`} onClick={goToCartShippingPage}>
            {t("complete")}
          </button>
        )}
      </div>
    </div>
  );
};

export default observer(CartSidebarFooter);
