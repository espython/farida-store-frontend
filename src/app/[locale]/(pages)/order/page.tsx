import React from "react";
import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";
import PageTitle from "@/components/PageTitle";
import PageContainer from "@/shared/ui/PageContainer";
import { OrderLookup } from "@/modules/orders";

interface OrderPageProps {
  params: { locale: string };
}

const OrderPage = ({ params: { locale } }: OrderPageProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("orders.tracking");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <OrderLookup />
      </PageContainer>
    </>
  );
};

export default OrderPage;
