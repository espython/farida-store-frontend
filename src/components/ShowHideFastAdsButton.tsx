"use client";
import React, { useContext } from "react";
import { IoMdClose } from "react-icons/io";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { StoreContext } from "@/contexts/StoreContext";

/** Dismiss button at the end of the announcement bar. */
const ShowHideFastAdsButton = () => {
  const { fastAds } = useContext(StoreContext);
  const t = useTranslations("announcement");

  if (!fastAds.showTheAds) return null;
  return (
    <button
      type="button"
      onClick={fastAds.toggleShowingAds}
      aria-label={t("dismiss")}
      className="absolute top-0 end-1 z-10 w-9 h-9 grid place-items-center text-cream/80 hover:text-cream"
    >
      <IoMdClose aria-hidden="true" />
    </button>
  );
};

export default observer(ShowHideFastAdsButton);
