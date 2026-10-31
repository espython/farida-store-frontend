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

const LoginForm = () => {
  const router = useRouter();

  const { loginForm } = useContext(StoreContext);
  const t = useTranslations("loginForm");

  const canSubmit =
    loginForm.email.length > 0 &&
    loginForm.password.length > 5 &&
    loginForm.isValidEmail;

  const loginWithEmailAndPass = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || loginForm.isLoading) return;
    loginForm.strapiLogin();
  };

  useEffect(() => {
    if (isUserLoggedIn()) {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginForm.isLoading]);

  return (
    <>
      <form noValidate onSubmit={loginWithEmailAndPass} className="flex flex-col gap-4">
        <TextField
          value={loginForm.email}
          type="email"
          autoComplete="email"
          required
          label={t("labels.email")}
          placeholder={t("placeholders.email")}
          error={!loginForm.isValidEmail ? t("errors.email") : undefined}
          onChange={(e) => {
            loginForm.setEmail(e.target.value);
            loginForm.validateEmail();
          }}
        />
        <PasswordField
          value={loginForm.password}
          autoComplete="current-password"
          required
          label={t("labels.password")}
          placeholder={t("placeholders.password")}
          onChange={(e) => {
            loginForm.setPassword(e.target.value);
          }}
        />

        {loginForm.errorMessage && (
          <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
            {loginForm.errorMessage}
          </p>
        )}

        <Button type="submit" size="lg" full disabled={!canSubmit || loginForm.isLoading} aria-busy={loginForm.isLoading}>
          {loginForm.isLoading && <Spinner size="sm" color="current" />}
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
        {t("noAccount")}{" "}
        <Link href="/register" className="font-bold text-garden underline underline-offset-4">
          {t("register")}
        </Link>
      </p>
    </>
  );
};

export default observer(LoginForm);
