"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { CartLineItem, CartSummary, useCart } from "@/modules/cart";
import { buttonClass } from "@/shared/ui/Button";
import CartSidebarEmptyCart from "./CartSidebarEmptyCart";
import CartSidebarHeader from "./CartSidebarHeader";
import { useDrawer } from "@/store/ui";

/** Cart drawer: lines, total and the way to checkout. */
const CartSideBarContent = () => {
  const cartSidebar = useDrawer("cart");
  const { lines, totals } = useCart();
  const router = useRouter();
  const t = useTranslations("cartSidebar");

  const goToCheckout = () => {
    router.push("/cart/shipping");
    cartSidebar.hide();
  };

  return (
    <div className="relative flex flex-col h-full">
      <CartSidebarHeader close={cartSidebar.hide} />

      {lines.length === 0 ? (
        <CartSidebarEmptyCart />
      ) : (
        <ul className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 flex flex-col divide-y divide-line">
          {lines.map((line) => (
            <li key={line.product.id} className="py-3 first:pt-0">
              <CartLineItem line={line} variant="compact" onNavigate={cartSidebar.hide} />
            </li>
          ))}
        </ul>
      )}

      <div className="shrink-0 border-t border-line bg-white p-5 flex flex-col gap-4">
        <CartSummary totals={totals} compact />
        {lines.length > 0 && (
          <button type="button" className={`${buttonClass({ size: "lg", full: true })} capitalize`} onClick={goToCheckout}>
            {t("complete")}
          </button>
        )}
      </div>
    </div>
  );
};

export default CartSideBarContent;
