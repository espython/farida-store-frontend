import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import AuthShell from "../AuthShell";
import ResetPasswordPanel from "./ResetPasswordPanel";

interface Props {
  params: { locale: string };
  searchParams: { key?: string | string[]; login?: string | string[] };
}

// Out of search results, and no Referer: the URL carries the one-time key.
export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "passwordReset" });
  return { title: t("resetTitle"), robots: { index: false }, referrer: "no-referrer" };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

const ResetPasswordPage = ({ params: { locale }, searchParams }: Props) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("passwordReset");
  return (
    <AuthShell title={t("resetTitle")}>
      <ResetPasswordPanel resetKey={first(searchParams.key)} login={first(searchParams.login)} />
    </AuthShell>
  );
};

export default ResetPasswordPage;
