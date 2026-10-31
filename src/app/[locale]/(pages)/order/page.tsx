import PageTitle from "@/components/PageTitle";
import React from "react";
import OrderForm from "./components/OrderForm";
import { unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import PageContainer from "@/shared/ui/PageContainer";

interface OrderPageProps {
  params: {
    locale: string;
  };
}

const OrderPage = ({ params: { locale } }: OrderPageProps) => {
  unstable_setRequestLocale(locale);

  const t = useTranslations("trackOrderPage");

  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <OrderForm />
      </PageContainer>
    </>
  );
};

export default OrderPage;
