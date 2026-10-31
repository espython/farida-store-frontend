import React from "react";
import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";
import PageTitle from "@/components/PageTitle";
import PageContainer from "@/shared/ui/PageContainer";
import { OrderTracking } from "@/modules/orders";

interface TrackOrderPageWithIdProps {
  params: { id: string; locale: string };
}

const TrackOrderPageWithId = ({ params: { id, locale } }: TrackOrderPageWithIdProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("orders.tracking");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <OrderTracking orderId={id} />
      </PageContainer>
    </>
  );
};

export default TrackOrderPageWithId;
