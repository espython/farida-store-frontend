"use client";
import { useLocale } from "next-intl";

/**
 * After signing in or registering, reload into the shop: legacy MobX and
 * cookie readers (header, menus) only pick up the session on a fresh load.
 */
export const useAfterSignIn = () => {
  const locale = useLocale();
  return () => window.location.assign(`/${locale}`);
};
