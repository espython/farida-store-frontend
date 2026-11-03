"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LuMail } from "react-icons/lu";
import Button from "@/shared/ui/Button";
import { useProfile } from "../application/useAccount";
import { useEmailVerification } from "../application/useEmailVerification";

type Note = "sent" | "recent" | "rate_limited" | "unavailable";

/**
 * Reminds a signed-in customer to confirm their email, with "send again".
 * Never blocks anything (a reminder only); hidden once confirmed.
 */
const EmailVerificationBanner = () => {
  const t = useTranslations("emailVerification");
  const { profile, retry } = useProfile();
  const { resend, resending } = useEmailVerification();
  const [note, setNote] = useState<Note | null>(null);

  if (!profile || profile.emailVerified) return null;

  const onResend = async () => {
    const result = await resend();
    if (!result.ok) return setNote(result.failure.code === "rate_limited" ? "rate_limited" : "unavailable");
    // Confirmed meanwhile (another tab or device): reload the profile and the banner goes.
    if (result.status === "verified") return void retry();
    setNote(result.status);
  };

  return (
    <section aria-labelledby="verify-email-title" className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-3xl bg-[#fbe9c4] text-saffron-ink p-4 md:p-5">
      <LuMail aria-hidden="true" className="shrink-0 text-2xl" />
      <div className="flex-1 min-w-0">
        <h2 id="verify-email-title" className="font-bold">
          {t("bannerTitle")}
        </h2>
        <p className="text-sm">{t.rich("bannerText", { email: () => <bdi className="font-semibold">{profile.email}</bdi> })}</p>
        {note && (
          <p role="status" className="text-sm mt-1 font-semibold">
            {t(`notes.${note}`)}
          </p>
        )}
      </div>
      <Button variant="outline" onClick={onResend} disabled={resending} className="shrink-0">
        {resending ? t("sending") : t("resend")}
      </Button>
    </section>
  );
};

export default EmailVerificationBanner;
