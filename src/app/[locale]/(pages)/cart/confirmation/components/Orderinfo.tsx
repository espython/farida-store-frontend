"use client";
import React, { useContext } from "react";
import InfoCard from "./InfoCard";
import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import { useLocale, useTranslations } from "next-intl";
import { getOrderPaymentDisplay } from "@/functions/orderPaymentState";
import { formatAmount } from "@/shared/lib/price";

const Orderinfo = () => {
  const { userOrders } = useContext(StoreContext);
  const t = useTranslations("confirmationPage");
  const currency = useTranslations("currency");
  const locale = useLocale();

  const formattedDate = new Date(
    userOrders.orderDetails.data?.attributes?.createdAt
  ).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const arrivedDate = userOrders.orderDetails.data?.attributes?.arrivedAt
    ? new Date(
        userOrders.orderDetails.data?.attributes?.arrivedAt
      ).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : t("orderInfo.date.soon");

  // Payment method comes from the server's payment_status: 'cod' for cash on
  // delivery, anything else means the order went through Paymob. The previous
  // check matched the client-supplied order_notes text and also tested
  // `!userPayment`, a field that no longer exists — so that branch was always
  // taken and the "Online Payment" arm below it was unreachable.
  const paymentInfo = getOrderPaymentDisplay(
    userOrders.orderDetails.data?.attributes
  );

  const information = [
    {
      title: t("orderInfo.information.orderFor"),
      description:
        userOrders.orderDetails.data?.attributes?.user?.data?.attributes
          ?.username,
    },
    {
      title: t("orderInfo.information.orderNumber"),
      description: userOrders.orderDetails?.data?.id,
    },
    {
      title: t("orderInfo.information.orderOn"),
      description: formattedDate,
    },
    {
      title: t("orderInfo.information.arrivedOn"),
      description: arrivedDate,
    },
    {
      title: t("orderInfo.information.totalPrice"),
      description: `${formatAmount(
        userOrders.orderDetails.data?.attributes?.total
      )} ${currency("currency")}`,
    },
    {
      title: t("orderInfo.information.payment"),
      description: paymentInfo.isCod ? t("payment.cod") : t("payment.online"),
    },
    {
      title: t("orderInfo.information.notes"),
      description: userOrders.orderDetails.data?.attributes?.order_notes,
    },
  ];

  return (
    <section aria-labelledby="order-info" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <h2 id="order-info" className="font-display text-xl md:text-2xl first-letter:uppercase">
        {t("orderInfo.information.title")}
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {information?.map(
          (info) =>
            info.description && (
              <InfoCard
                key={info.title}
                title={info.title}
                description={info.description?.toString() ?? ""}
              />
            )
        )}
      </dl>
    </section>
  );
};

export default observer(Orderinfo);
