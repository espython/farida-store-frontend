"use client";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

const REASONS = ["cancelled", "expired", "unverified_email", "staff", "conflict", "failed"] as const;
type Reason = (typeof REASONS)[number];

/** Why "Continue with Google" brought the visitor back here (?google=<reason>), if it did. */
const GoogleSignInNotice = () => {
  const t = useTranslations("google.errors");
  const raw = useSearchParams().get("google");
  const reason = (REASONS as readonly string[]).includes(raw ?? "") ? (raw as Reason) : null;
  if (!reason) return null;
  return (
    <p role="alert" className={`p-4 rounded-2xl text-sm ${reason === "cancelled" ? "bg-sand text-garden" : "bg-[#fde8e6] text-[#b42318]"}`}>
      {t(reason)}
    </p>
  );
};

export default GoogleSignInNotice;
