"use client";
import React, { useContext, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocale } from "next-intl";
import { StoreContext } from "@/contexts/StoreContext";
import PageContainer from "@/shared/ui/PageContainer";
import EmptyCart from "./EmptyCart";
import CartContent from "./CartContent";

const CartPageContainer = () => {
  const { cart } = useContext(StoreContext);
  const locale = useLocale();
  // The guest cart lives in sessionStorage, which the server cannot read, and this page
  // hydrates after the layout has already loaded it: render the cart only after mount
  // so the first client render matches the server HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <PageContainer className="pb-8">
      <div dir={locale === "en" ? "ltr" : "rtl"}>
        {!mounted ? (
          <div className="h-64 rounded-3xl bg-sand animate-pulse" aria-busy="true" />
        ) : cart.productsCount === 0 ? (
          <EmptyCart />
        ) : (
          <CartContent />
        )}
      </div>
    </PageContainer>
  );
};

export default observer(CartPageContainer);
