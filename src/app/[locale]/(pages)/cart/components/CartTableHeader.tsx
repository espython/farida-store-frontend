import { useTranslations } from "next-intl";
import React from "react";

const CartTableHeader = () => {
  const t = useTranslations("cartPage");
  return (
    <div className="hidden md:grid grid-cols-[1fr_8rem_7rem_2.75rem] gap-4 py-4 border-b border-line text-sm font-semibold text-garden-muted capitalize">
      <span>{t("cartHome.header.product")}</span>
      <span className="text-center">{t("cartHome.header.quantity")}</span>
      <span className="text-end">{t("cartHome.header.total")}</span>
      <span />
    </div>
  );
};

export default CartTableHeader;
