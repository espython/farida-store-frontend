"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { buttonClass } from "@/shared/ui/Button";
import { useTranslations } from "next-intl";
import React, { useContext } from "react";

const ConfirmMergeCart = () => {
  const { user, cart, cartSidebar } = useContext(StoreContext);
  const t = useTranslations("mergeCart");

  const accept = () => {
    user.setIsMergingOrRemovingLoading = true;
    user.mergeLocalCartWithUserCart(cart.userCartItems).then((check) => {
      if (check) {
        user.setIsMergingOrRemovingLoading = false;
      }
    });
  };

  const refuse = () => {
    user.setIsMergingOrRemovingLoading = true;
    user.clearLocalCart().then((check) => {
      if (check) {
        user.setIsMergingOrRemovingLoading = false;
      }
    });
  };

  return (
    <div role="status" className="m-5 mb-0 p-4 rounded-2xl bg-[#fbe9c4] flex flex-col gap-3">
      <p className="font-semibold capitalize">{t("merge")}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={`${buttonClass()} capitalize px-3`} onClick={accept}>
          {t("yes")}
        </button>
        <button type="button" className={`${buttonClass({ variant: "ghost" })} capitalize px-3 bg-white`} onClick={refuse}>
          {t("no")}
        </button>
      </div>
    </div>
  );
};

export default observer(ConfirmMergeCart);
