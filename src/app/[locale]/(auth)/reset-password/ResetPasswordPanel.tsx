"use client";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { LuCheck } from "react-icons/lu";
import { ResetPasswordForm, toResetLink } from "@/modules/customer";
import Button from "@/shared/ui/Button";
import { useAfterSignIn } from "../useAfterSignIn";

/** The reset form, then "password changed, you're signed in". */
const ResetPasswordPanel = ({ resetKey, login }: { resetKey: string | null; login: string | null }) => {
  const t = useTranslations("passwordReset");
  const continueShopping = useAfterSignIn();
  const link = useMemo(() => toResetLink(resetKey, login), [resetKey, login]);
  const [done, setDone] = useState(false);

  // The key stays out of the address bar and the history once read.
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span aria-hidden="true" className="grid place-items-center w-14 h-14 rounded-full bg-garden text-cream text-2xl">
          <LuCheck />
        </span>
        <p className="text-[1.0625rem]">{t("done")}</p>
        <div>
          <Button size="lg" onClick={continueShopping}>
            {t("continue")}
          </Button>
        </div>
      </div>
    );
  }
  return <ResetPasswordForm link={link} onDone={() => setDone(true)} />;
};

export default ResetPasswordPanel;
