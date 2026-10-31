import PageTitle from "@/components/PageTitle";
import React from "react";
import UserPagesMenu from "./components/UserPagesMenu";
import { unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import PageContainer from "@/shared/ui/PageContainer";

interface UserPageProps {
  params: { locale: string };
}

const UserPage = ({ params: { locale } }: UserPageProps) => {
  unstable_setRequestLocale(locale);

  const t = useTranslations("userPage");
  return (
    <>
      <PageTitle title={t("account")} />
      <PageContainer className="pt-6 pb-8">
        <UserPagesMenu />
      </PageContainer>
    </>
  );
};

export default UserPage;
