import PageTitle from "@/components/PageTitle";
import React from "react";
import WishListSections from "./WishListSections";
import { useTranslations } from "next-intl";
import PageContainer from "@/shared/ui/PageContainer";

const WishListContainer = () => {
  const t = useTranslations("wishList");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <WishListSections />
      </PageContainer>
    </>
  );
};

export default WishListContainer;
