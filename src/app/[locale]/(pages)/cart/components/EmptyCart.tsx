"use client";
import EmptyState from "@/shared/ui/EmptyState";
import { buttonClass } from "@/shared/ui/Button";
import { FaBagShopping } from "react-icons/fa6";
import React, { useContext } from "react";
import { useRouter } from "@/navigation";
import ConfirmMergeCart from "@/components/ConfirmMergeCart";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";

const EmptyCart = () => {
  const { cartSidebar, user } = useContext(StoreContext);
  const { isLoggedIn } = useAuth();
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
      {isLoggedIn && cartSidebar.isLocalCartHasItems && !user.isMergingOrRemovingLoading && <ConfirmMergeCart />}
    </div>
  );
};

export default observer(EmptyCart);
