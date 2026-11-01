import React from "react";
import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";
import PageTitle from "@/components/PageTitle";
import PageContainer from "@/shared/ui/PageContainer";
import { AddressBook } from "@/modules/customer";

interface UserAddressesPageProps {
  params: { locale: string };
}

const UserAddressesPage = ({ params: { locale } }: UserAddressesPageProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("account.addresses");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <AddressBook />
      </PageContainer>
    </>
  );
};

export default UserAddressesPage;
