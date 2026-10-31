"use client";
import { buttonClass } from "@/shared/ui/Button";
import { StoreContext } from "@/contexts/StoreContext";
import { isUserLoggedIn } from "@/functions/credentials";
import { Input } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import React, { useContext } from "react";
import { BiSend } from "react-icons/bi";
import { MdDeleteForever } from "react-icons/md";

const CartFooter = () => {
  const { cart, user } = useContext(StoreContext);
  const t = useTranslations("cartPage");

  const deleteAllCartProducts = () => {
    if (isUserLoggedIn()) {
      user.setIsMergingOrRemovingLoading = true;
      user.clearUserCart(cart.userCartItems).then(() => {
        user.setIsMergingOrRemovingLoading = false;
      });
    } else {
      user.setIsMergingOrRemovingLoading = true;
      cart.deleteAllProducts();
      user.setIsMergingOrRemovingLoading = false;
    }
  };

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
        onClick={deleteAllCartProducts}
        className={`${buttonClass({ variant: "ghost" })} text-[#b42318] capitalize`}
      >
        <MdDeleteForever className="text-xl" aria-hidden="true" />
        {t("cartHome.footer.removeAll")}
      </button>
    </div>
  );
};

export default CartFooter;
