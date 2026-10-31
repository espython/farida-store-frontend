"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import TextField from "@/shared/ui/TextField";
import PasswordField from "@/shared/ui/PasswordField";
import Button from "@/shared/ui/Button";
import { validateRegistration, type RegistrationInput } from "../domain/credentials";
import type { Session } from "../domain/Session";
import { useAuthActions } from "../application/useAuthActions";
import type { AuthFailure } from "../application/authFailure";

type Values = RegistrationInput & { confirm: string };
type Field = keyof Values;

const RegisterForm = ({ onRegistered }: { onRegistered: (session: Session) => void }) => {
  const t = useTranslations("registerForm");
  const errorsT = useTranslations("authErrors");
  const { register: registerCustomer, pending } = useAuthActions();
  const [failure, setFailure] = useState<AuthFailure["code"] | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<Values>({ defaultValues: { firstName: "", lastName: "", email: "", password: "", confirm: "" } });

  // The domain rules run here and again in the BFF; both use the same codes.
  const rule = (field: keyof RegistrationInput) => (value: string) => {
    const code = validateRegistration({ ...getValues(), [field]: value })[field];
    return code ? errorsT(code) : true;
  };

  const submit = handleSubmit(async ({ confirm: _confirm, ...input }) => {
    setFailure(null);
    const result = await registerCustomer(input);
    if (result.ok) return onRegistered(result.session);
    for (const [field, code] of Object.entries(result.failure.fields)) {
      if (code) setError(field as Field, { message: errorsT(code) });
    }
    if (result.failure.code === "email_taken") setError("email", { message: errorsT("email_taken") });
    else if (result.failure.code !== "invalid_input") setFailure(result.failure.code);
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          {...register("firstName", { validate: rule("firstName") })}
          autoComplete="given-name"
          label={t("labels.first")}
          placeholder={t("placeholders.first")}
          error={errors.firstName?.message}
        />
        <TextField
          {...register("lastName", { validate: rule("lastName") })}
          autoComplete="family-name"
          label={t("labels.last")}
          placeholder={t("placeholders.last")}
          error={errors.lastName?.message}
        />
      </div>
      <TextField
        {...register("email", { validate: rule("email") })}
        type="email"
        autoComplete="email"
        label={t("labels.email")}
        placeholder={t("placeholders.email")}
        error={errors.email?.message}
      />
      <PasswordField
        {...register("password", { validate: rule("password") })}
        autoComplete="new-password"
        label={t("labels.password")}
        placeholder={t("placeholders.password")}
        hint={t("errors.password")}
        error={errors.password?.message}
      />
      <PasswordField
        {...register("confirm", {
          validate: (v) => (v === getValues("password") ? true : t("errors.confirm")),
        })}
        autoComplete="new-password"
        label={t("labels.confirm")}
        placeholder={t("placeholders.confirm")}
        error={errors.confirm?.message}
      />
      {failure && (
        <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
          {errorsT("unavailable")}
        </p>
      )}
      <Button type="submit" size="lg" full disabled={pending} aria-busy={pending}>
        {pending && <Spinner size="sm" color="current" />}
        <span className="first-letter:uppercase">{t("submit")}</span>
      </Button>
    </form>
  );
};

export default RegisterForm;
