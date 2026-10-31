import PageTitle from "@/components/PageTitle";
import React from "react";
import OrderCardsContainer from "./OrderCardsContainer";
import { useTranslations } from "next-intl";
import PageContainer from "@/shared/ui/PageContainer";

const UserOrdersPageContainer = () => {
  const t = useTranslations("userOrders");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <OrderCardsContainer />
      </PageContainer>
    </>
  );
};

export default UserOrdersPageContainer;
