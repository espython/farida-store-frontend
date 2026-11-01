import React from "react";
import { unstable_setRequestLocale } from "next-intl/server";
import { ShippingStep } from "@/modules/checkout";
import PageContainer from "@/shared/ui/PageContainer";

interface ShippingPageProps {
  params: { locale: string };
}

const ShippingPage = ({ params: { locale } }: ShippingPageProps) => {
  unstable_setRequestLocale(locale);
  return (
    <PageContainer className="pb-8">
      <ShippingStep />
    </PageContainer>
  );
};

export default ShippingPage;
