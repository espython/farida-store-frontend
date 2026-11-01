"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Money } from "@/shared/kernel/Money";
import { buttonClass } from "@/shared/ui/Button";
import type { OrderSummary } from "../domain/Order";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatDate } from "./format";

/** One order in the customer's list. */
const OrderCard = ({ order }: { order: OrderSummary }) => {
  const t = useTranslations("orders");
  const currency = useTranslations("currency");
  const locale = useLocale();
  const heading = t("order", { number: order.id });
  const facts: [string, string][] = [
    [t("list.orderedOn"), formatDate(order.createdAt, locale)],
    [t("list.items"), t("list.itemCount", { count: order.itemCount })],
    [t("list.total"), `${Money.toDisplay(order.total)} ${currency("currency")}`],
  ];
  return (
    <article aria-label={heading} className="h-full bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">{heading}</h2>
        <OrderStatusBadge status={order.status} />
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 content-start">
        {facts.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 min-w-0">
            <dt className="text-sm text-garden-muted">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-line">
        <Link href={`/order/${order.id}`} className={buttonClass({ full: true })}>
          {t("list.details")}
        </Link>
        <Link href={`/trackorder/${order.id}`} className={buttonClass({ variant: "outline", full: true })}>
          {t("list.track")}
        </Link>
      </div>
    </article>
  );
};

export default OrderCard;
