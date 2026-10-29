"use client";
import { Link } from "@/navigation";
import React, { useContext, useEffect } from "react";
import { FaRegHeart } from "react-icons/fa";
import Icon from "./Icon";
import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

interface fullWishlistIconProps {
  className?: string;
  hasBorder?: boolean;
  hasBorderHover?: boolean;
  showPop?: boolean;
}

const FullWishlistIcon = ({
  className,
  hasBorder = true,
  hasBorderHover = true,
  showPop = true,
}: fullWishlistIconProps) => {
  const { wishlist, userWishlist, loginForm, registerForm } =
    useContext(StoreContext);
  const { isLoggedIn } = useAuth();
  const t = useTranslations("header");

  useEffect(() => {
    if (isLoggedIn) {
      userWishlist.getUserWishlistItems();
    } else {
      userWishlist.resetAllStates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoggedIn,
    userWishlist.userWishlistProductsCount,
    loginForm.isLoading,
    registerForm.isLoading,
  ]);

  return (
    <div>
      <Link href={"/wishlist"} aria-label={t("wishlist")}>
        <Icon
          icon={<FaRegHeart className={className} />}
          hasBorder={hasBorder}
          hasBorderHover={hasBorderHover}
          showPop={showPop}
          // count={userWishlist.userWishlistProductsCount}
          count={userWishlist.userWishlistProductsCount}
        />
      </Link>
    </div>
  );
};

export default observer(FullWishlistIcon);
