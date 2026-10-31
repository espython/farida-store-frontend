"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import TextField from "@/shared/ui/TextField";
import PasswordField from "@/shared/ui/PasswordField";
import Button from "@/shared/ui/Button";
import { emailError, PASSWORD_MAX_LENGTH } from "../domain/credentials";
import type { Session } from "../domain/Session";
import { useAuthActions } from "../application/useAuthActions";
import type { AuthFailure } from "../application/authFailure";

interface Props {
  /** Called after WordPress accepted the credentials and the cookie is set. */
  onSignedIn: (session: Session) => void;
  /** Smaller spacing for the header dropdown. */
  compact?: boolean;
}

type Values = { email: string; password: string };

const SignInForm = ({ onSignedIn, compact = false }: Props) => {
  const t = useTranslations("loginForm");
  const errorsT = useTranslations("authErrors");
  const { signIn, pending } = useAuthActions();
  const [failure, setFailure] = useState<AuthFailure["code"] | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ defaultValues: { email: "", password: "" } });

  const submit = handleSubmit(async ({ email, password }) => {
    setFailure(null);
    const result = await signIn(email, password);
    if (result.ok) onSignedIn(result.session);
    else setFailure(result.failure.code);
  });

  return (
    <form noValidate onSubmit={submit} className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <TextField
        {...register("email", {
          validate: (v) => (emailError(v) ? errorsT("email_invalid") : true),
        })}
        type="email"
        autoComplete="email"
        label={t("labels.email")}
        placeholder={compact ? undefined : t("placeholders.email")}
        error={errors.email?.message}
      />
      <PasswordField
        {...register("password", {
          required: errorsT("password_required"),
          maxLength: { value: PASSWORD_MAX_LENGTH, message: errorsT("password_too_long") },
        })}
        autoComplete="current-password"
        label={t("labels.password")}
        placeholder={compact ? undefined : t("placeholders.password")}
        error={errors.password?.message}
      />
      {failure && (
        <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
          {errorsT(failure === "invalid_credentials" ? "invalid_credentials" : "unavailable")}
        </p>
      )}
      <Button type="submit" size={compact ? "md" : "lg"} full disabled={pending} aria-busy={pending}>
        {pending && <Spinner size="sm" color="current" />}
        <span className="first-letter:uppercase">{t("submit")}</span>
      </Button>
    </form>
  );
};

export default SignInForm;
