"use client";

import React from "react";
import { FaGoogle } from "react-icons/fa";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { buttonClass } from "@/shared/ui/Button";

interface providerProps {
  format?: "small" | "large";
}

const GoogleProvider = ({ format = "large" }: providerProps) => {
  const t = useTranslations("google");

  // Google sign-in is not wired up (the old Firebase popup was removed);
  // whether to keep it is an open decision (A2).
  const googleSign = () => {};

  return format === "large" ? (
    <button type="button" onClick={googleSign} className={buttonClass({ variant: "outline", full: true })}>
      <FaGoogle aria-hidden="true" />
      <span className="first-letter:uppercase">{t("continue")}</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={googleSign}
      aria-label={t("continue")}
      className="w-11 h-11 grid place-items-center rounded-full border-2 border-garden text-garden hover:bg-garden hover:text-cream transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-garden"
    >
      <FaGoogle aria-hidden="true" />
    </button>
  );
};

export default observer(GoogleProvider);
