"use client";
import React, { useContext } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { LuBanknote, LuCreditCard, LuShieldCheck } from "react-icons/lu";
import { getOrderPaymentDisplay } from "@/functions/orderPaymentState";
import { formatAmount } from "@/shared/lib/price";
import Badge from "@/shared/ui/Badge";

const STATUS_TONE = {
  completed: "success",
  pending: "warning",
  failed: "danger",
  unknown: "muted",
} as const;

const PaymentDetails = () => {
  const { userOrders } = useContext(StoreContext);
  const t = useTranslations("confirmationPage.payment");
  const currency = useTranslations("currency");

  const totalAmount = userOrders.orderDetails.data?.attributes?.total;

  const paymentInfo = getOrderPaymentDisplay(
    userOrders.orderDetails.data?.attributes
  );

  return (
    <section aria-labelledby="payment-details" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 grid place-items-center rounded-full bg-sand text-xl" aria-hidden="true">
          {paymentInfo.isCod ? <LuBanknote /> : <LuCreditCard />}
        </span>
        <div>
          <h2 id="payment-details" className="font-display text-xl md:text-2xl">
            {t("title")}
          </h2>
          <p className="text-sm text-garden-muted">{t("subtitle")}</p>
        </div>
      </div>

      <dl className="flex flex-col divide-y divide-line">
        <div className="flex justify-between items-center gap-4 py-3">
          <dt className="text-garden-muted">{t("method")}</dt>
          <dd className="font-semibold">{paymentInfo.isCod ? t("cod") : t("online")}</dd>
        </div>
        <div className="flex justify-between items-center gap-4 py-3">
          <dt className="text-garden-muted">{t("status")}</dt>
          <dd>
            <Badge tone={STATUS_TONE[paymentInfo.status]}>{t(`statuses.${paymentInfo.status}`)}</Badge>
          </dd>
        </div>
        {/* Amount. Only claim "paid" once the server says so -- a pending or
            failed payment still owes this, so it is labelled as the order
            total and not styled as a settled payment. */}
        <div className="flex justify-between items-baseline gap-4 py-3">
          <dt className="text-garden-muted">
            {paymentInfo.status === "completed" ? t("amountPaid") : t("orderTotal")}
          </dt>
          <dd className="text-xl font-bold">
            {formatAmount(totalAmount)} <span className="text-sm">{currency("currency")}</span>
          </dd>
        </div>
      </dl>

      {/* Transaction details (online payments) */}
      {paymentInfo.method === "online" &&
        (paymentInfo.transactionId || paymentInfo.paymobOrderId) && (
          <dl className="rounded-2xl bg-cream p-4 flex flex-col gap-2 text-sm">
            {paymentInfo.transactionId && (
              <div className="flex justify-between items-center gap-4">
                <dt className="text-garden-muted">{t("transactionId")}</dt>
                <dd className="font-mono" dir="ltr">{paymentInfo.transactionId}</dd>
              </div>
            )}
            {paymentInfo.paymobOrderId && (
              <div className="flex justify-between items-center gap-4">
                <dt className="text-garden-muted">{t("paymobOrderId")}</dt>
                <dd className="font-mono" dir="ltr">{paymentInfo.paymobOrderId}</dd>
              </div>
            )}
          </dl>
        )}

      {paymentInfo.method === "cod" && (
        <p className="rounded-2xl bg-[#fbe9c4] text-saffron-ink p-4 text-sm">{t("codNote")}</p>
      )}

      <p className="flex items-center gap-2 text-sm text-garden-muted">
        <LuShieldCheck aria-hidden="true" className="text-garden" />
        {t("secure")}
      </p>
    </section>
  );
};

export default observer(PaymentDetails);
