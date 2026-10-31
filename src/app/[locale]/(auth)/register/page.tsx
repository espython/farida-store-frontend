import React from "react";
import type { Metadata } from "next";

import AuthShell from "../AuthShell";
import RegisterPanel from "./RegisterPanel";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

interface RegisterPageProps {
  params: { locale: string };
}

// Account pages stay out of search results.
export async function generateMetadata({ params: { locale } }: RegisterPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "registerForm" });
  return { title: t("register"), robots: { index: false } };
}

const RegisterPage = ({ params: { locale } }: RegisterPageProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("registerForm");

  return (
    <AuthShell title={t("register")}>
      <RegisterPanel />
    </AuthShell>
  );
};

export default RegisterPage;
