"use client";
import React, { useContext } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useLocale, useTranslations } from "next-intl";
import { formatAmount } from "@/shared/lib/price";
import { Image } from "@nextui-org/react";

const PaymentSummary = () => {
  const { cart } = useContext(StoreContext);
  const locale = useLocale();
  const t = useTranslations("paymentPage");
  const pf = useTranslations("paymentFlow");
  const currency = useTranslations("currency");

  const cartItems = cart.userCartItems;
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 50; // Fixed shipping cost
  const tax = subtotal * 0.14; // 14% tax
  const total = subtotal + shipping + tax;

  const row = "flex justify-between items-baseline gap-4";
  return (
    <section aria-labelledby="payment-summary" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <h2 id="payment-summary" className="font-display text-xl md:text-2xl">
        {pf("orderSummary")}
      </h2>
      <ul className="divide-y divide-line">
        {cartItems.map((item) => (
          <li key={item.id} className="py-3 grid grid-cols-[4rem_1fr_auto] gap-3 items-center">
            <div className="w-16 aspect-square rounded-xl overflow-hidden bg-sand">
              {item.imgSrc && <Image src={item.imgSrc} alt="" radius="none" removeWrapper className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-snug line-clamp-2">
                {locale === "ar" && item.localizatons?.title ? item.localizatons.title : item.title}
              </p>
              <p className="text-sm text-garden-muted">
                {pf("qty")}: {item.quantity}
              </p>
            </div>
            <p className="font-bold">
              {formatAmount(item.price)} <span className="text-sm">{currency("currency")}</span>
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 pt-4 border-t border-line">
        <div className={row}>
          <span className="text-garden-muted">{pf("subtotal")}</span>
          <span className="font-semibold">{formatAmount(subtotal)} {currency("currency")}</span>
        </div>
        <div className={row}>
          <span className="text-garden-muted">{pf("shipping")}</span>
          <span className="font-semibold">{formatAmount(shipping)} {currency("currency")}</span>
        </div>
        <div className={row}>
          <span className="text-garden-muted">{pf("tax")} (14%)</span>
          <span className="font-semibold">{formatAmount(tax)} {currency("currency")}</span>
        </div>
        <div className={`${row} pt-3 border-t border-line`}>
          <span className="font-bold">{pf("total")}</span>
          <span className="text-xl font-bold">
            {formatAmount(total)} <span className="text-sm">{currency("currency")}</span>
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 pt-4 border-t border-line">
        <p className="text-sm text-garden-muted">{pf("acceptedPaymentMethods")}</p>
        <div className="flex items-center gap-3">
          <Image src="/Visa_Inc._logo.svg.png" alt="Visa" radius="none" className="h-5 w-auto" />
          <Image src="/MasterCard_Logo.svg.webp" alt="Mastercard" radius="none" className="h-6 w-auto" />
          <span className="text-sm text-garden-muted">{pf("more")}</span>
        </div>
        <p className="text-sm p-3 rounded-2xl bg-[#dcebe0]">{pf("allTransactionsAreSecured")}</p>
        <p className="text-sm text-garden-muted">{pf("returnPolicyItemsCan")}</p>
      </div>
    </section>
  );
};

export default observer(PaymentSummary);
