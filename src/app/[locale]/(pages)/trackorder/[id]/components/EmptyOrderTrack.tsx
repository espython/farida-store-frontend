"use client";
import { Link } from "@/navigation";
import React from "react";
import { LuPackageX } from "react-icons/lu";
import { useTranslations } from "next-intl";
import EmptyState from "@/shared/ui/EmptyState";
import { buttonClass } from "@/shared/ui/Button";

const EmptyOrderTrack = () => {
  const t = useTranslations("userOrders");

  return (
    <EmptyState
      role="status"
      icon={<LuPackageX />}
      title={t("trackOrderPage.empty.description")}
      text={t("trackOrderPage.empty.text")}
      action={
        <Link href="/userorders" className={buttonClass()}>
          {t("trackOrderPage.empty.action")}
        </Link>
      }
    />
  );
};

export default EmptyOrderTrack;
