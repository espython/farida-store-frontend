import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { useTranslations } from "next-intl";
import React from "react";
import { LuPackageX } from "react-icons/lu";

const NoOrder = () => {
  const t = useTranslations("confirmationPage");
  return (
    <EmptyState
      role="status"
      icon={<LuPackageX />}
      title={t("orderItems.noOrder")}
      text={t("orderItems.noOrderText")}
      action={
        <Link href="/userorders" className={buttonClass()}>
          {t("orderItems.myOrders")}
        </Link>
      }
    />
  );
};

export default NoOrder;
