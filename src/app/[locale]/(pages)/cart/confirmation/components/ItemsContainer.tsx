"use client";
import React, { useContext, useEffect } from "react";

import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import OrderItem from "../../../order/[id]/components/OrderItem";
import { useLocale, useTranslations } from "next-intl";

const ItemsContainer = () => {
  const { userOrders } = useContext(StoreContext);
  const t = useTranslations("confirmationPage");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("order_number");

  useEffect(() => {
    if (orderId) {
      userOrders.getAllOrderItems(orderId ?? "");
    } else {
      router.push("/cart/shipping");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section aria-labelledby="confirmation-items" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-2">
      <h2 id="confirmation-items" className="font-display text-xl md:text-2xl first-letter:uppercase">
        {t("orderItems.title")}
      </h2>
      <ul className="divide-y divide-line">
        {userOrders?.orderItems?.data?.map((orderItem) => (
          <li key={orderItem.id} className="py-3">
            <OrderItem
              id={orderItem.attributes.product.data?.id}
              title={
                locale === "en"
                  ? orderItem.attributes.product.data?.attributes?.title
                  : orderItem.attributes.product.data?.attributes?.localizations
                      ?.data[0]?.attributes?.title
              }
              imgsrc={
                orderItem.attributes.product.data?.attributes?.thumbnail?.data
                  ?.attributes?.url
              }
              price={orderItem.attributes.product.data?.attributes?.price}
              quantity={orderItem.attributes?.quantity}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default observer(ItemsContainer);
