"use client";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { safeNextPath } from "@/modules/customer";

/** The page that sent the visitor to sign in (`?next=`, our own pages only), else the home page. */
export const useNextPath = () => {
  const locale = useLocale();
  return safeNextPath(useSearchParams().get("next")) ?? `/${locale}`;
};

/**
 * After signing in or registering, reload into the shop (back to the page
 * that asked for sign-in, if any): legacy MobX and cookie readers (header,
 * menus) only pick up the session on a fresh load.
 */
export const useAfterSignIn = () => {
  const next = useNextPath();
  return () => window.location.assign(next);
};
