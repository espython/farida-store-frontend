"use client";
import { Image } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Money } from "@/shared/kernel/Money";
import { isInProgress, type Order } from "../domain/Order";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatAddress, formatDate } from "./format";

/**
 * An order's details and summary, side by side on desktop: used by the order
 * page and by the checkout confirmation.
 */
const OrderOverview = ({ order, showStatus = true }: { order: Order; showStatus?: boolean }) => {
  const t = useTranslations("orders");
  const currency = useTranslations("currency");
  const locale = useLocale() as "en" | "ar";
  const amount = (m: Money) => (
    <>
      {Money.toDisplay(m)} <span className="text-sm">{currency("currency")}</span>
    </>
  );
  const a = order.address;
  const facts: [string, string][] = [
    [t("details.number"), `#${order.id}`],
    [t("details.date"), formatDate(order.createdAt, locale)],
    [t("details.payment"), t(`payment.${order.payment}`)],
    ...(order.deliveredAt ? ([[t("details.deliveredOn"), formatDate(order.deliveredAt, locale)]] as [string, string][]) : []),
    [t("details.deliverTo"), `${a.firstName} ${a.lastName}`.trim()],
    [t("details.phone"), a.phone],
    [t("details.address"), formatAddress(a, locale, t("details.separator"))],
    ...(order.note ? ([[t("details.note"), order.note]] as [string, string][]) : []),
  ];
  const row = "flex justify-between items-baseline gap-3";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      <section aria-labelledby="order-details" className="lg:col-span-7 bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="order-details" className="font-display text-xl md:text-2xl">
            {t("details.title")}
          </h2>
          {showStatus && <OrderStatusBadge status={order.status} />}
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {facts
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 min-w-0">
                <dt className="text-sm text-garden-muted">{label}</dt>
                <dd className="font-semibold break-words">
                  <bdi>{value}</bdi>
                </dd>
              </div>
            ))}
        </dl>
        {order.payment === "cod" && isInProgress(order.status) && (
          <p className="rounded-2xl bg-[#fbe9c4] text-saffron-ink p-4 text-sm">{t("details.codNote")}</p>
        )}
      </section>

      <section aria-labelledby="order-summary" className="lg:col-span-5 lg:sticky lg:top-24 bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
        <h2 id="order-summary" className="font-display text-xl md:text-2xl">
          {t("summary.title")}
        </h2>
        <ul className="divide-y divide-line">
          {order.lines.map((l, i) => (
            <li key={`${l.productId}-${i}`} className="py-3 grid grid-cols-[3.5rem_1fr_auto] gap-3 items-center">
              <span className="w-14 aspect-square rounded-xl overflow-hidden bg-sand">
                {l.image && <Image src={l.image} alt="" radius="none" removeWrapper className="w-full h-full object-cover" />}
              </span>
              <span className="min-w-0">
                {l.slug ? (
                  <Link
                    href={`/product/${l.slug}`}
                    className="block font-semibold leading-snug line-clamp-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-garden rounded"
                  >
                    {l.title}
                  </Link>
                ) : (
                  <span className="block font-semibold leading-snug line-clamp-2">{l.title}</span>
                )}
                <span className="text-sm text-garden-muted">× {l.quantity}</span>
              </span>
              <span className="font-bold whitespace-nowrap">{amount(l.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 pt-4 border-t border-line">
          <div className={row}>
            <dt className="text-garden-muted">{t("summary.items")}</dt>
            <dd className="font-semibold">{amount(order.totals.items)}</dd>
          </div>
          <div className={row}>
            <dt className="text-garden-muted">{t("summary.shipping")}</dt>
            <dd className="font-semibold">{order.totals.shipping.amount > 0 ? amount(order.totals.shipping) : t("summary.free")}</dd>
          </div>
          {order.totals.discount.amount > 0 && (
            <div className={row}>
              <dt className="text-garden-muted">{t("summary.discount")}</dt>
              <dd className="font-semibold text-saffron-ink">−{amount(order.totals.discount)}</dd>
            </div>
          )}
          <div className={`${row} pt-3 mt-1 border-t border-line`}>
            <dt className="font-bold">{t("summary.total")}</dt>
            <dd className="text-xl font-bold">{amount(order.totals.total)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
};

export default OrderOverview;
