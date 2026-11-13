"use client";

import React from "react";
import { FaGoogle } from "react-icons/fa";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { safeNextPath } from "@/modules/customer";
import { buttonClass } from "@/shared/ui/Button";

/** Google sign-in is on when the OAuth client id is configured (with GOOGLE_CLIENT_SECRET on the server). */
export const googleSignInEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

interface providerProps {
  format?: "small" | "large";
}

/**
 * "Continue with Google": a plain link (full navigation) to the BFF, which
 * sends the visitor to Google and back. Renders nothing when not configured.
 */
const GoogleProvider = ({ format = "large" }: providerProps) => {
  const t = useTranslations("google");
  const locale = useLocale();
  const next = safeNextPath(useSearchParams().get("next"));
  if (!googleSignInEnabled) return null;

  const href = `/api/auth/google/start?${new URLSearchParams({ locale, ...(next ? { next } : {}) })}`;
  return format === "large" ? (
    <a href={href} className={buttonClass({ variant: "outline", full: true })}>
      <FaGoogle aria-hidden="true" />
      <span className="first-letter:uppercase">{t("continue")}</span>
    </a>
  ) : (
    <a
      href={href}
      aria-label={t("continue")}
      className="w-11 h-11 grid place-items-center rounded-full border-2 border-garden text-garden hover:bg-garden hover:text-cream transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-garden"
    >
      <FaGoogle aria-hidden="true" />
    </a>
  );
};

export default GoogleProvider;
