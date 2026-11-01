"use client";
import { Link } from "@/navigation";
import React from "react";
import { FaRegHeart } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useWishlist } from "@/modules/wishlist";
import Icon from "./Icon";

interface fullWishlistIconProps {
  className?: string;
  hasBorder?: boolean;
  hasBorderHover?: boolean;
  showPop?: boolean;
}

/** Header link to the wishlist with the number of saved products (guest or account). */
const FullWishlistIcon = ({ className, hasBorder = true, hasBorderHover = true, showPop = true }: fullWishlistIconProps) => {
  const t = useTranslations("header");
  const { count, hydrated } = useWishlist();

  return (
    <div>
      <Link href={"/wishlist"} aria-label={t("wishlist")}>
        <Icon
          icon={<FaRegHeart className={className} />}
          hasBorder={hasBorder}
          hasBorderHover={hasBorderHover}
          showPop={showPop}
          count={hydrated ? count : 0}
        />
      </Link>
    </div>
  );
};

export default FullWishlistIcon;
