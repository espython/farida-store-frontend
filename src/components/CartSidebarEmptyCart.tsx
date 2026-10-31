import { useTranslations } from "next-intl";
import React from "react";
import { FaBagShopping } from "react-icons/fa6";

const CartSidebarEmptyCart = () => {
  const t = useTranslations("cartSidebar");
  return (
    <div className="flex-1 p-8 flex flex-col gap-4 justify-center items-center text-center">
      <div className="w-20 h-20 grid place-items-center rounded-full bg-sand">
        <FaBagShopping className="text-3xl" aria-hidden="true" />
      </div>
      <p className="font-display text-xl capitalize">{t("empty")}</p>
    </div>
  );
};

export default CartSidebarEmptyCart;
