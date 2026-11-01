import React from "react";
import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";
import PageTitle from "@/components/PageTitle";
import PageContainer from "@/shared/ui/PageContainer";
import { OrderDetail } from "@/modules/orders";

interface OrderNumberPageProps {
  params: { id: string; locale: string };
}

const OrderNumberPage = ({ params: { id, locale } }: OrderNumberPageProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("orders");
  return (
    <>
      <PageTitle title={t("order", { number: id })} />
      <PageContainer className="pt-6 pb-8">
        <OrderDetail orderId={id} />
      </PageContainer>
    </>
  );
};

export default OrderNumberPage;
