"use client";
import React, { useContext } from "react";
import InfoCard from "./InfoCard";
import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import { useTranslations } from "next-intl";

const OrderAddress = () => {
  const { userOrders } = useContext(StoreContext);
  const t = useTranslations("confirmationPage");

  const information = [
    {
      title: t("orderAddress.street"),
      description: userOrders.orderDetails?.data?.attributes?.street,
    },
    {
      title: t("orderAddress.city"),
      description: userOrders.orderDetails?.data?.attributes?.city,
    },
    {
      title: t("orderAddress.state"),
      description: userOrders.orderDetails?.data?.attributes?.state,
    },
    {
      title: t("orderAddress.country"),
      description: userOrders.orderDetails?.data?.attributes?.country,
    },
    {
      title: t("orderAddress.postal"),
      description: userOrders.orderDetails?.data?.attributes?.postal_code,
    },
    {
      title: t("orderAddress.phone1"),
      description: userOrders.orderDetails?.data?.attributes?.phone,
    },
    {
      title: t("orderAddress.phone2"),
      description: userOrders.orderDetails?.data?.attributes?.second_phone,
    },
  ];

  return (
    <section aria-labelledby="order-address" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <h2 id="order-address" className="font-display text-xl md:text-2xl first-letter:uppercase">
        {t("orderAddress.title")}
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

export default observer(OrderAddress);
