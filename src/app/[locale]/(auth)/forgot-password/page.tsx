import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ForgotPasswordForm } from "@/modules/customer";
import AuthShell from "../AuthShell";

interface Props {
  params: { locale: string };
}

// Account pages stay out of search results.
export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "passwordReset" });
  return { title: t("forgotTitle"), robots: { index: false } };
}

const ForgotPasswordPage = ({ params: { locale } }: Props) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("passwordReset");
  return (
    <AuthShell title={t("forgotTitle")}>
      <ForgotPasswordForm />
    </AuthShell>
  );
};

export default ForgotPasswordPage;
