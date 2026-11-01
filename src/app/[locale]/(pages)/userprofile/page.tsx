import React from "react";
import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";
import PageTitle from "@/components/PageTitle";
import PageContainer from "@/shared/ui/PageContainer";
import { ProfileCard } from "@/modules/customer";

interface UserProfilePageProps {
  params: { locale: string };
}

const UserProfilePage = ({ params: { locale } }: UserProfilePageProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("account.profile");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <ProfileCard />
      </PageContainer>
    </>
  );
};

export default UserProfilePage;
