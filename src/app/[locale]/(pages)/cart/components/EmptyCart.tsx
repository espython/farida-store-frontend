"use client";
import EmptyState from "@/shared/ui/EmptyState";
import { buttonClass } from "@/shared/ui/Button";
import { FaBagShopping } from "react-icons/fa6";
import React from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

const EmptyCart = () => {
  const t = useTranslations("cartPage");
  const router = useRouter();

  const goToHomePage = () => {
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-4">
      <EmptyState
        icon={<FaBagShopping aria-hidden="true" />}
        title={<span className="capitalize">{t("emptyCart.title")}</span>}
        action={
          <button type="button" className={`${buttonClass()} capitalize`} onClick={goToHomePage}>
            {t("emptyCart.action")}
          </button>
        }
      />
    </div>
  );
};

export default EmptyCart;
