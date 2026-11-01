import React from "react";
import { unstable_setRequestLocale } from "next-intl/server";
import { OrderConfirmation } from "@/modules/checkout";
import PageContainer from "@/shared/ui/PageContainer";

interface ConfirmationPageProps {
  params: { locale: string };
  searchParams: { order?: string; order_number?: string };
}

// `order_number` is what the card payment callback still sends (C3b).
const ConfirmationPage = ({ params: { locale }, searchParams }: ConfirmationPageProps) => {
  unstable_setRequestLocale(locale);
  const id = searchParams.order ?? searchParams.order_number ?? null;
  return (
    <PageContainer className="pb-8">
      <OrderConfirmation orderId={id && /^\d{1,12}$/.test(id) ? id : null} />
    </PageContainer>
  );
};

export default ConfirmationPage;
