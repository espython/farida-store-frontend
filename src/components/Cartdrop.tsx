"use client";

import { Link } from "@/navigation";
import React, { useContext, useState } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { StoreContext } from "@/contexts/StoreContext";
import EmptyCartDrop from "./EmptyCartDrop";
import CartDropProductsMenu from "./CartDropProductsMenu";
import CartDropTotalPrice from "./CartDropTotalPrice";
import { Divider } from "@nextui-org/react";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmMergeCart from "./ConfirmMergeCart";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";

const CartDrop2 = () => {
  const { cart, user, cartSidebar } = useContext(StoreContext);
  const { isLoggedIn } = useAuth();

  const locale = useLocale();
  const t = useTranslations("cartDrop");

  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{
        scaleY: cart.isCartMenuDisplayed ? 1 : 0,
        opacity: cart.isCartMenuDisplayed ? 1 : 0,
      }}
      className="origin-top w-[25rem] p-5 hidden md:block text-garden absolute top-full end-0 z-[100] bg-white rounded-3xl shadow-xl border border-line"
      dir={locale === "en" ? "ltr" : "rtl"}
    >
      <div className="flex flex-col gap-5 relative">
        {user.isMergingOrRemovingLoading && <LoadingOverlay />}
        <p className="font-display text-xl capitalize">
          {t("cart")} <span className="text-garden-muted">({cart.productsCount})</span>
        </p>

        {cart.productsCount === 0 ? (
          <EmptyCartDrop />
        ) : (
          <CartDropProductsMenu />
        )}

        {cart.productsCount > 0 && (
          <>
            <Divider className="bg-line" />
            {isLoggedIn &&
              cartSidebar.isLocalCartHasItems &&
              !user.isMergingOrRemovingLoading && <ConfirmMergeCart />}
            <CartDropTotalPrice />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default observer(CartDrop2);
