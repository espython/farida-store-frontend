import { Link } from "@/navigation";
import React from "react";
import { LuHeart } from "react-icons/lu";
import { useTranslations } from "next-intl";
import EmptyState from "@/shared/ui/EmptyState";
import { buttonClass } from "@/shared/ui/Button";

const WishListIsEmpty = () => {
  const t = useTranslations("wishList");

  return (
    <EmptyState
      icon={<LuHeart />}
      title={t("content.emptyWishlist.empty")}
      text={t("content.emptyWishlist.text")}
      action={
        <Link href="/" className={buttonClass()}>
          {t("content.emptyWishlist.action")}
        </Link>
      }
    />
  );
};

export default WishListIsEmpty;
