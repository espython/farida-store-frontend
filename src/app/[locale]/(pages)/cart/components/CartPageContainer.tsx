"use client";
import React from "react";
import { useLocale } from "next-intl";
import { useCart } from "@/modules/cart";
import PageContainer from "@/shared/ui/PageContainer";
import EmptyCart from "./EmptyCart";
import CartContent from "./CartContent";

const CartPageContainer = () => {
  const { lines, hydrated } = useCart();
  const locale = useLocale();

  return (
    <PageContainer className="pb-8">
      <div dir={locale === "en" ? "ltr" : "rtl"}>
        {/* The guest cart is read from storage after mount; until then the server and client markup match. */}
        {!hydrated ? (
          <div className="h-64 rounded-3xl bg-sand animate-pulse" aria-busy="true" />
        ) : lines.length === 0 ? (
          <EmptyCart />
        ) : (
          <CartContent />
        )}
      </div>
    </PageContainer>
  );
};

export default CartPageContainer;
