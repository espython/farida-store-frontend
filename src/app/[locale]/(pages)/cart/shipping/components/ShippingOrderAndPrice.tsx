"use client";
import React, { useContext } from "react";
import ShippingRowDetails from "./ShippingRowDetails";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import OrderedItem from "./OrderedItem";
import { useLocale, useTranslations } from "next-intl";

const ShippingOrderAndPrice = () => {
  const { cart } = useContext(StoreContext);
  const t = useTranslations("shippingPage");
  const locale = useLocale();

  return (
    <section aria-labelledby="shipping-summary" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <h2 id="shipping-summary" className="font-display text-xl md:text-2xl capitalize">
        {t("order.title")}
      </h2>
      <ul className="divide-y divide-line">
        {cart.userCartItems.map((product) => (
          <li key={product.id} className="py-3">
            {/* Unit price: OrderedItem multiplies by the quantity itself. */}
            <OrderedItem
              title={locale === "en" ? product.title : product.localizatons.title}
              price={product.price}
              imgSrc={product.imgSrc}
              quantity={product.quantity}
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 pt-4 border-t border-line">
        <ShippingRowDetails title={t("order.footer.totalPrices")} price={cart.totalPrice} />
        {/* Flat 100 EGP until shipping zones come from Woo (C3). */}
        <ShippingRowDetails title={t("order.footer.shipping")} price={100} />
        <ShippingRowDetails
          title={t("order.footer.total")}
          price={cart.totalPrice + 100}
          titleStyle="font-bold"
          priceStyle="text-xl font-bold"
        />
      </div>
      <p className="text-sm text-garden-muted first-letter:uppercase">{t("order.check")}</p>
    </section>
  );
};

export default observer(ShippingOrderAndPrice);
