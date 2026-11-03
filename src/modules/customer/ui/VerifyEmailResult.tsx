"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import { LuCheck } from "react-icons/lu";
import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import type { VerifyLink } from "../domain/emailVerification";
import { useEmailVerification } from "../application/useEmailVerification";

type State = "verifying" | "done" | "invalid" | "rate_limited" | "unavailable";

/** Opens from the emailed link: confirms once, then says so (signed in or not). */
const VerifyEmailResult = ({ link }: { link: VerifyLink | null }) => {
  const t = useTranslations("emailVerification");
  const { verify } = useEmailVerification();
  const [state, setState] = useState<State>(link ? "verifying" : "invalid");
  const started = useRef(false);

  useEffect(() => {
    if (!link || started.current) return;
    started.current = true;
    verify(link).then((r) => {
      if (r.ok) setState("done");
      else setState(r.failure.code === "invalid_verify_link" ? "invalid" : r.failure.code === "rate_limited" ? "rate_limited" : "unavailable");
    });
  }, [link, verify]);

  if (state === "verifying") {
    return (
      // A div, not a p: the spinner renders divs, and a div inside a p breaks hydration.
      <div role="status" className="flex items-center gap-3">
        <Spinner size="sm" color="current" />
        {t("verifying")}
      </div>
    );
  }
  if (state === "done") {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span aria-hidden="true" className="grid place-items-center w-14 h-14 rounded-full bg-garden text-cream text-2xl">
          <LuCheck />
        </span>
        <p className="text-[1.0625rem]">{t("done")}</p>
        <div>
          <Link href="/" className={buttonClass()}>
            {t("continue")}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div role="alert" className="flex flex-col gap-4">
      <p className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318]">{t(`errors.${state}`)}</p>
      <div>
        <Link href="/user" className={buttonClass()}>
          {t("toAccount")}
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailResult;
