"use client";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocale } from "next-intl";
import type { Locale } from "@/shared/kernel/Locale";
import { emptyPromotions } from "../domain/Promotion";
import { contentApi } from "./contentApi";
import { contentActions, selectAnnouncementDismissed } from "./contentSlice";

const EMPTY = emptyPromotions();

/** The promotions in the page's language; empty while loading or if WordPress is unreachable. */
export const usePromotions = () => {
  const locale = useLocale() as Locale;
  const { data } = contentApi.useGetPromotionsQuery(locale);
  return data ?? EMPTY;
};

/** The announcement bar: its messages, and whether the shopper closed it. */
export const useAnnouncementBar = () => {
  const dispatch = useDispatch();
  const { announcements } = usePromotions();
  const dismissed = useSelector(selectAnnouncementDismissed);
  const dismiss = useCallback(() => dispatch(contentActions.announcementDismissed()), [dispatch]);
  return { messages: announcements, visible: !dismissed && announcements.length > 0, dismiss };
};
