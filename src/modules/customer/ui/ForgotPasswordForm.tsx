"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import { LuMailCheck } from "react-icons/lu";
import { Link } from "@/navigation";
import TextField from "@/shared/ui/TextField";
import Button, { buttonClass } from "@/shared/ui/Button";
import { emailError } from "../domain/credentials";
import { RESET_LINK_HOURS } from "../domain/passwordReset";
import { usePasswordReset } from "../application/usePasswordReset";
import type { AuthFailure } from "../application/authFailure";

/**
 * Asks for the account email and sends the reset link. The confirmation is
 * the same whether or not the email has an account.
 */
const ForgotPasswordForm = () => {
  const t = useTranslations("passwordReset");
  const errorsT = useTranslations("authErrors");
  const { requestReset, sending } = usePasswordReset();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [failure, setFailure] = useState<AuthFailure["code"] | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ defaultValues: { email: "" } });

  const submit = handleSubmit(async ({ email }) => {
    setFailure(null);
    const result = await requestReset(email);
    if (result.ok) setSentTo(email.trim());
    else setFailure(result.failure.code);
  });

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span aria-hidden="true" className="grid place-items-center w-14 h-14 rounded-full bg-sand text-garden text-2xl">
          <LuMailCheck />
        </span>
        <p className="text-[1.0625rem]">
          {t.rich("sent", { email: () => <bdi className="font-bold">{sentTo}</bdi> })}
        </p>
        <p className="text-garden-muted">{t("sentHint", { hours: RESET_LINK_HOURS })}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className={buttonClass()}>
            {t("backToLogin")}
          </Link>
          <Button variant="ghost" onClick={() => setSentTo(null)}>
            {t("tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-garden-muted">{t("forgotText")}</p>
      <TextField
        {...register("email", { validate: (v) => (emailError(v) ? errorsT("email_invalid") : true) })}
        type="email"
        autoComplete="email"
        label={t("email")}
        error={errors.email?.message}
      />
      {failure && (
        <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
          {errorsT(failure === "rate_limited" ? "rate_limited" : "unavailable")}
        </p>
      )}
      <Button type="submit" size="lg" full disabled={sending} aria-busy={sending}>
        {sending && <Spinner size="sm" color="current" />}
        {t("send")}
      </Button>
      <p className="text-center text-garden-muted">
        <Link href="/login" className="font-bold text-garden underline underline-offset-4">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;
