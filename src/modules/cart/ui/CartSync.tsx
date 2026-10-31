"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { useCartPersistence } from "../application/cartPersistence";
import { useGuestCartMerge } from "../application/useGuestCartMerge";

/**
 * Mounted once near the root: loads the browser cart, follows other tabs,
 * and after sign-in moves the browser cart into the customer's saved cart.
 */
const CartSync = () => {
  const t = useTranslations("cart");
  useCartPersistence();
  const outcome = useGuestCartMerge();

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

export default CartSync;
