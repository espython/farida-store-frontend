"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { useWishlistPersistence } from "../application/wishlistPersistence";
import { useGuestWishlistMerge } from "../application/useGuestWishlistMerge";

/** Mounted once near the root: loads the browser list, follows other tabs, moves it to the account after sign-in. */
const WishlistSync = () => {
  const t = useTranslations("wishlist");
  useWishlistPersistence();
  const outcome = useGuestWishlistMerge();

  useEffect(() => {
    if (!outcome) return;
    if (outcome.status === "failed") toast.error(t("mergeFailed"));
    else {
      if (outcome.count > 0) toast.success(t("merged", { count: outcome.count }));
      if (outcome.skipped > 0) toast.warning(t("mergeSkipped", { count: outcome.skipped }));
    }
  }, [outcome, t]);

  return null;
};

export default WishlistSync;
