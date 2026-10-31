import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { useTranslations } from "next-intl";
import React from "react";
import { LuPackageOpen } from "react-icons/lu";

const EmptyOrders = () => {
  const t = useTranslations("userOrders");
  return (
    <EmptyState
      icon={<LuPackageOpen />}
      title={t("empty")}
      text={t("emptyText")}
      action={
        <Link href="/" className={buttonClass()}>
          {t("startShopping")}
        </Link>
      }
    />
  );
};

export default EmptyOrders;
