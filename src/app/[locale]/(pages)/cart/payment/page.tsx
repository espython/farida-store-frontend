import React from "react";
import { unstable_setRequestLocale } from "next-intl/server";
import { PaymentStep } from "@/modules/checkout";
import PageContainer from "@/shared/ui/PageContainer";

interface PaymentPageProps {
  params: { locale: string };
}

const PaymentPage = ({ params: { locale } }: PaymentPageProps) => {
  unstable_setRequestLocale(locale);
  return (
    <PageContainer className="pb-8">
      <PaymentStep />
    </PageContainer>
  );
};

export default PaymentPage;
