import PageTitle from "@/components/PageTitle";
import React from "react";
import AddressesContainer from "./AddressesContainer";
import { useTranslations } from "next-intl";
import PageContainer from "@/shared/ui/PageContainer";

const UserAddressPageContainer = () => {
  const t = useTranslations("userAdderesses");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <AddressesContainer />
      </PageContainer>
    </>
  );
};

export default UserAddressPageContainer;
