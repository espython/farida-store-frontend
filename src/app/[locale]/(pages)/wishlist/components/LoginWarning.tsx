import { Link } from "@/navigation";
import React from "react";
import { LuHeart } from "react-icons/lu";
import { useTranslations } from "next-intl";
import EmptyState from "@/shared/ui/EmptyState";
import { buttonClass } from "@/shared/ui/Button";

const LoginWarning = () => {
  const t = useTranslations("wishList");

  return (
    <EmptyState
      icon={<LuHeart />}
      title={t("noSignIn.descritpion")}
      action={
        <Link href="/login" className={buttonClass()}>
          {t("noSignIn.action")}
        </Link>
      }
    />
  );
};

export default LoginWarning;
