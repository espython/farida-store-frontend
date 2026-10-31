import React from "react";
import type { Metadata } from "next";

import LoginForm from "./components/LoginForm";
import AuthShell from "../AuthShell";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

interface LoginPageProps {
  params: { locale: string };
}

// Account pages stay out of search results.
export async function generateMetadata({ params: { locale } }: LoginPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "loginForm" });
  return { title: t("login"), robots: { index: false } };
}

const LoginPage = ({ params: { locale } }: LoginPageProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("loginForm");

  return (
    <AuthShell title={t("login")}>
      <LoginForm />
    </AuthShell>
  );
};

export default LoginPage;
