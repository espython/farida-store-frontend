import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import AuthShell from "../AuthShell";
import VerifyEmailPanel from "./VerifyEmailPanel";

interface Props {
  params: { locale: string };
  searchParams: { id?: string | string[]; token?: string | string[] };
}

// Out of search results, and no Referer: the URL carries a one-time token.
export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "emailVerification" });
  return { title: t("pageTitle"), robots: { index: false }, referrer: "no-referrer" };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

const VerifyEmailPage = ({ params: { locale }, searchParams }: Props) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("emailVerification");
  return (
    <AuthShell title={t("pageTitle")}>
      <VerifyEmailPanel id={first(searchParams.id)} token={first(searchParams.token)} />
    </AuthShell>
  );
};

export default VerifyEmailPage;
