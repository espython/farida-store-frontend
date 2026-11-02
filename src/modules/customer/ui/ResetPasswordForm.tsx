"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import { Link } from "@/navigation";
import PasswordField from "@/shared/ui/PasswordField";
import Button, { buttonClass } from "@/shared/ui/Button";
import { passwordError } from "../domain/credentials";
import type { ResetLink } from "../domain/passwordReset";
import type { Session } from "../domain/Session";
import { usePasswordReset } from "../application/usePasswordReset";
import type { AuthFailure } from "../application/authFailure";

interface Props {
  /** From the emailed link; null when the page was opened without a usable one. */
  link: ResetLink | null;
  /** Called once the password is set and the customer is signed in. */
  onDone: (session: Session) => void;
}

type Values = { password: string; confirm: string };

/** New password (twice), checked by the same rule as registration. */
const ResetPasswordForm = ({ link, onDone }: Props) => {
  const t = useTranslations("passwordReset");
  const errorsT = useTranslations("authErrors");
  const { reset, resetting } = usePasswordReset();
  const [failure, setFailure] = useState<AuthFailure["code"] | null>(link ? null : "invalid_reset_link");
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues: { password: "", confirm: "" } });

  if (failure === "invalid_reset_link" || !link) {
    return (
      <div role="alert" className="flex flex-col gap-4">
        <p className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318]">{errorsT("invalid_reset_link")}</p>
        <div>
          <Link href="/forgot-password" className={buttonClass()}>
            {t("newLink")}
          </Link>
        </div>
      </div>
    );
  }

  const submit = handleSubmit(async ({ password }) => {
    setFailure(null);
    const result = await reset(link, password);
    if (result.ok) return onDone(result.session);
    const code = result.failure.fields.password;
    if (result.failure.code === "invalid_input" && code) setError("password", { message: errorsT(code) });
    else setFailure(result.failure.code);
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-garden-muted">{t("resetText")}</p>
      <PasswordField
        {...register("password", {
          validate: (v) => {
            const code = passwordError(v);
            return code ? errorsT(code) : true;
          },
        })}
        autoComplete="new-password"
        label={t("newPassword")}
        hint={t("rules")}
        error={errors.password?.message}
      />
      <PasswordField
        {...register("confirm", { validate: (v) => (v === getValues("password") ? true : t("mismatch")) })}
        autoComplete="new-password"
        label={t("confirmPassword")}
        error={errors.confirm?.message}
      />
      {failure && (
        <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
          {errorsT(failure === "rate_limited" ? "rate_limited" : "unavailable")}
        </p>
      )}
      <Button type="submit" size="lg" full disabled={resetting} aria-busy={resetting}>
        {resetting && <Spinner size="sm" color="current" />}
        {t("save")}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
