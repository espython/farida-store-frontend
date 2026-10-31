import { useTranslations } from "next-intl";
import React from "react";
import { PiShoppingBagOpenDuotone } from "react-icons/pi";
import EmptyState from "@/shared/ui/EmptyState";

const EmptyProducts = () => {
  const t = useTranslations("emptyProduct");
  return (
    <EmptyState
      role="status"
      icon={<PiShoppingBagOpenDuotone aria-hidden="true" />}
      title={<span className="capitalize">{t("noProducts")}</span>}
      text={t("again")}
    />
  );
};

export default EmptyProducts;
