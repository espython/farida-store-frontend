"use client";
import React, { useContext } from "react";
import OrderItem from "./OrderItem";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useLocale, useTranslations } from "next-intl";

const OrderItemsContainer = () => {
  const { userOrders } = useContext(StoreContext);
  const t = useTranslations("userOrders");
  const locale = useLocale();

  return (
    <section aria-labelledby="order-items" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-2">
      <h2 id="order-items" className="font-display text-xl md:text-2xl first-letter:uppercase">
        {t("orderPage.orderItems")}
      </h2>
      <ul className="divide-y divide-line">
        {userOrders?.orderItems?.data?.map((item) => (
          <li key={item.id} className="py-3">
            <OrderItem
              id={item.attributes.product.data?.id}
              title={
                locale === "en"
                  ? item.attributes.product.data?.attributes?.title
                  : item.attributes.product.data?.attributes?.localizations
                      ?.data[0]?.attributes?.title
              }
              imgsrc={
                item.attributes.product.data?.attributes?.thumbnail?.data
                  ?.attributes?.url
              }
              price={item.attributes.product.data?.attributes?.price}
              quantity={item.attributes?.quantity}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default observer(OrderItemsContainer);
