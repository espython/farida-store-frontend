"use client";
import React from "react";
import OrderCardInfo from "./OrderCardInfo";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { buttonClass } from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import { formatAmount } from "@/shared/lib/price";

type OrderStatus = "placed" | "delivery" | "arrived";

const STATUS_TONE = { placed: "muted", delivery: "warning", arrived: "success" } as const;

interface orderCardProps {
  orderNumber: number;
  totalPrice: number;
  orderedOn: Date;
  arrivedOn: Date;
  orderItemsCount: number;
  status?: OrderStatus;
}

const OrderCard = ({
  totalPrice,
  orderNumber,
  orderedOn,
  arrivedOn,
  orderItemsCount,
  status,
}: orderCardProps) => {
  const locale = useLocale();
  const t = useTranslations("userOrders");
  const currency = useTranslations("currency");

  const orderedOnDate = new Date(orderedOn).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const arrivedOnDate = arrivedOn
    ? new Date(arrivedOn).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : t("details.soon");

  const information: { title: string; description: string }[] = [
    { title: t("details.orderedOn"), description: orderedOnDate },
    { title: t("details.arrivedOn"), description: arrivedOnDate },
    { title: t("details.numberOfItems"), description: `${orderItemsCount}` },
    {
      title: t("details.totalPrice"),
      description: `${formatAmount(totalPrice)} ${currency("currency")}`,
    },
  ];

  const heading = t("details.order", { number: orderNumber });

  return (
    <article aria-label={heading} className="h-full bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">{heading}</h2>
        {status && STATUS_TONE[status] && <Badge tone={STATUS_TONE[status]}>{t(`statuses.${status}`)}</Badge>}
      </div>
      <dl className="grid grid-cols-2 gap-4 flex-1 content-start">
        {information.map((item) => (
          <OrderCardInfo key={item.title} title={item.title} description={item.description} />
        ))}
      </dl>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-line">
        <Link href={`/order/${orderNumber}`} className={buttonClass({ full: true })}>
          {t("details.actions.seeDetails")}
        </Link>
        <Link href={`/trackorder/${orderNumber}`} className={buttonClass({ variant: "outline", full: true })}>
          {t("details.actions.trackOrder")}
        </Link>
      </div>
    </article>
  );
};

export default OrderCard;
