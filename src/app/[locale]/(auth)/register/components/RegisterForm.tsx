"use client";
import { Link, useRouter } from "@/navigation";
import React, { useContext, useEffect } from "react";
import GoogleProvider from "../../GoogleProvider";
import PasswordField from "../../PasswordField";

import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { isUserLoggedIn } from "@/functions/credentials";
import TextField from "@/shared/ui/TextField";
import Button from "@/shared/ui/Button";
import { Spinner } from "@nextui-org/react";

const RegisterForm = () => {
  const { registerForm } = useContext(StoreContext);
  const t = useTranslations("registerForm");
  const router = useRouter();

  useEffect(() => {
    registerForm.setDisabledCondition(
      registerForm.isValidEmail &&
        registerForm.isValidPassword &&
        registerForm.email.length > 0 &&
        registerForm.password.length > 0 &&
        registerForm.confirmedPassword.length > 0 &&
        registerForm.firstName.length > 0 &&
        registerForm.lastName.length > 0 &&
        registerForm.username.length > 0 &&
        registerForm.password === registerForm.confirmedPassword
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    registerForm.isValidEmail,
    registerForm.isValidPassword,
    registerForm.email,
    registerForm.password,
    registerForm.confirmedPassword,
    registerForm.firstName,
    registerForm.lastName,
    registerForm.username,
  ]);

  useEffect(() => {
    if (isUserLoggedIn() && !registerForm.errorMessage) {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerForm.isLoading, registerForm.errorMessage]);

  // The submit button was type="submit" without preventDefault, so the
  // browser also posted the form and reloaded the page mid-request.
  const register = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!registerForm.disabledCondition || registerForm.isLoading) return;
    registerForm.strapiRegister();
  };

  const confirmMismatch =
    registerForm.confirmedPassword.length > 0 &&
    registerForm.confirmedPassword !== registerForm.password;

  return (
    <>
      <form noValidate onSubmit={register} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            value={registerForm.firstName}
            autoComplete="given-name"
            required
            label={t("labels.first")}
            placeholder={t("placeholders.first")}
            onChange={(e) => {
              registerForm.setFirstName(e.target.value);
            }}
          />
          <TextField
            value={registerForm.lastName}
            autoComplete="family-name"
            required
            label={t("labels.last")}
            placeholder={t("placeholders.last")}
            onChange={(e) => {
              registerForm.setlastName(e.target.value);
            }}
          />
        </div>

        <TextField
          value={registerForm.username}
          autoComplete="username"
          required
          label={t("labels.username")}
          placeholder={t("placeholders.username")}
          onChange={(e) => {
            registerForm.setUsername(e.target.value);
          }}
        />

        <TextField
          value={registerForm.email}
          type="email"
          autoComplete="email"
          required
          label={t("labels.email")}
          placeholder={t("placeholders.email")}
          error={!registerForm.isValidEmail ? t("errors.email") : undefined}
          onChange={(e) => {
            registerForm.setEmail(e.target.value);
            registerForm.validateEmail();
          }}
        />
        <PasswordField
          value={registerForm.password}
          autoComplete="new-password"
          required
          label={t("labels.password")}
          placeholder={t("placeholders.password")}
          hint={t("errors.password")}
          error={
            registerForm.password.length > 0 && !registerForm.isValidPassword
              ? t("errors.password")
              : undefined
          }
          onChange={(e) => {
            registerForm.setPassword(e.target.value);
            registerForm.validatePassword();
          }}
        />
        <PasswordField
          value={registerForm.confirmedPassword}
          autoComplete="new-password"
          required
          label={t("labels.confirm")}
          placeholder={t("placeholders.confirm")}
          error={confirmMismatch ? t("errors.confirm") : undefined}
          onChange={(e) => {
            registerForm.setConfirmedPassword(e.target.value);
          }}
        />

        {registerForm.errorMessage && (
          <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
            {registerForm.errorMessage}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          full
          disabled={!registerForm.disabledCondition || registerForm.isLoading}
          aria-busy={registerForm.isLoading}
        >
          {registerForm.isLoading && <Spinner size="sm" color="current" />}
          <span className="first-letter:uppercase">{t("submit")}</span>
        </Button>
      </form>

      <div className="flex items-center gap-4 text-sm text-garden-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        {t("or")}
        <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleProvider />

      <p className="text-center text-garden-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-bold text-garden underline underline-offset-4">
          {t("login")}
        </Link>
      </p>
    </>
  );
};

export default observer(RegisterForm);
