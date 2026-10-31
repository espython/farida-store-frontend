import React from "react";
import UserInformation from "./components/UserInformation";
import PageTitle from "@/components/PageTitle";
import { unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import PageContainer from "@/shared/ui/PageContainer";

interface ContactPageProps {
  params: { locale: string };
}

const UserProfilePage = ({ params: { locale } }: ContactPageProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("userProfilePage");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <UserInformation />
      </PageContainer>
    </>
  );
};

export default UserProfilePage;
