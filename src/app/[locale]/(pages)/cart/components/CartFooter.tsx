"use client";
import { buttonClass } from "@/shared/ui/Button";
import { useCart } from "@/modules/cart";
import { Input } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import React from "react";
import { BiSend } from "react-icons/bi";
import { MdDeleteForever } from "react-icons/md";

const CartFooter = () => {
  const { clear } = useCart();
  const t = useTranslations("cartPage");

  return (
    <div className="flex flex-wrap justify-between items-end gap-3">
      {/* The coupon field has no behaviour yet: coupons come with the Woo checkout (C3). */}
      <Input
        type="text"
        aria-label={t("cartHome.footer.code")}
        placeholder={t("cartHome.footer.code")}
        radius="full"
        className="w-full sm:w-72"
        classNames={{ inputWrapper: "h-11 bg-white border border-line shadow-none" }}
        endContent={<BiSend className="text-lg" aria-hidden="true" />}
      />
      <button
        type="button"
        onClick={clear}
        className={`${buttonClass({ variant: "ghost" })} text-[#b42318] capitalize`}
      >
        <MdDeleteForever className="text-xl" aria-hidden="true" />
        {t("cartHome.footer.removeAll")}
      </button>
    </div>
  );
};

export default CartFooter;
