"use client";
import { useTranslations } from "next-intl";
import React from "react";
import { IoMdClose } from "react-icons/io";

interface cartSidebarProps {
  close: () => void;
}

const CartSidebarHeader = ({ close }: cartSidebarProps) => {
  const t = useTranslations("cartSidebar");
  return (
    <div className="flex justify-between items-center px-5 h-16 border-b border-line shrink-0">
      <p className="font-display text-xl capitalize">{t("cart")}</p>
      <button
        type="button"
        onClick={close}
        aria-label={t("close")}
        className="w-11 h-11 grid place-items-center rounded-full hover:bg-sand"
      >
        <IoMdClose className="text-2xl" aria-hidden="true" />
      </button>
    </div>
  );
};

export default CartSidebarHeader;
