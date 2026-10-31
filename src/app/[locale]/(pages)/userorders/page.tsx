import React from "react";
import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";
import PageTitle from "@/components/PageTitle";
import PageContainer from "@/shared/ui/PageContainer";
import { OrderList } from "@/modules/orders";

interface UserOrdersPageProps {
  params: { locale: string };
}

const UserOrdersPage = ({ params: { locale } }: UserOrdersPageProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("orders");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <OrderList />
      </PageContainer>
    </>
  );
};

export default UserOrdersPage;
