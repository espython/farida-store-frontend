"use client";
import React, { useContext } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useLocale, useTranslations } from "next-intl";
import EmptyOrderTrack from "./EmptyOrderTrack";
import TrackStep, { StepState } from "./TrackStep";
import { useOwnedOrder } from "@/hooks/useOwnedOrder";
import { getOrderPaymentDisplay } from "@/functions/orderPaymentState";
import PageContainer from "@/shared/ui/PageContainer";
import PageSkeleton from "@/components/feedback/PageSkeleton";
import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";

const STEPS = ["placed", "delivery", "arrived"] as const;
const DAY = 24 * 60 * 60 * 1000;

const TrackOrderContainer = ({ orderId }: { orderId: string }) => {
  const { userOrders } = useContext(StoreContext);
  const locale = useLocale();
  const t = useTranslations("userOrders.trackOrderPage");
  const access = useOwnedOrder(orderId);

  if (access === "loading") return <PageSkeleton variant="detail" />;
  if (access === "denied")
    return (
      <PageContainer className="pt-6 pb-8">
        <EmptyOrderTrack />
      </PageContainer>
    );

  const order = userOrders.orderDetails.data.attributes;
  const reached = Math.max(0, STEPS.indexOf(order.status));
  const stateOf = (i: number): StepState =>
    i < reached || (i === reached && order.status === "arrived") ? "done" : i === reached ? "current" : "upcoming";
  const stateLabel = (s: StepState) => t(`status.${s}`);

  const formatDate = (d: Date) =>
    d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const ordered = new Date(order.createdAt);
  const arrival = order.arrivedAt ? new Date(order.arrivedAt) : null;

  // Share of the delivery window that has passed (ordered → expected arrival).
  let progress = 0;
  let remaining = "";
  if (arrival) {
    const total = arrival.getTime() - ordered.getTime();
    const left = arrival.getTime() - Date.now();
    progress = total > 0 ? Math.min(100, Math.max(0, ((total - left) / total) * 100)) : 100;
    remaining = left <= 0 ? "" : left < DAY ? t("shipped.fewHours") : t("shipped.daysLeft", { count: Math.floor(left / DAY) });
  }
  if (order.status === "arrived") progress = 100;

  const address = [order.street, order.city, order.state].filter(Boolean).join(locale === "ar" ? "، " : ", ");
  const isCod = getOrderPaymentDisplay(order).isCod;

  return (
    <PageContainer className="pt-6 pb-8">
      <section aria-labelledby="track-heading" className="max-w-2xl mx-auto bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="track-heading" className="font-display text-xl md:text-2xl">
            {t("orderNumber", { number: orderId })}
          </h2>
          <Link href={`/order/${orderId}`} className={buttonClass({ variant: "ghost" })}>
            {t("details")}
          </Link>
        </div>

        <ol>
          <TrackStep index={1} state={stateOf(0)} title={t("recieved.placed")} stateLabel={stateLabel(stateOf(0))}>
            <p>{t("recieved.confirm")}</p>
            {address && (
              <p className="text-sm">
                {t("recieved.address")} <bdi className="font-semibold text-garden">{address}</bdi>
              </p>
            )}
          </TrackStep>

          <TrackStep index={2} state={stateOf(1)} title={t("shipped.way")} stateLabel={stateLabel(stateOf(1))}>
            <div className="flex flex-col gap-2">
              <div
                role="progressbar"
                aria-label={t("shipped.progress")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                className="h-2 rounded-full bg-sand overflow-hidden"
              >
                <div className="h-full rounded-full bg-garden" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
                <span>{formatDate(ordered)}</span>
                {remaining && <span className="font-semibold text-garden">{remaining}</span>}
                <span>
                  {t("shipped.deliveredDate")}{" "}
                  <span className="font-semibold text-garden">{arrival ? formatDate(arrival) : t("shipped.soon")}</span>
                </span>
              </div>
            </div>
          </TrackStep>

          <TrackStep index={3} state={stateOf(2)} title={t("paid.arrived")} stateLabel={stateLabel(stateOf(2))} last>
            {order.status === "arrived" ? (
              <p>{t("shipped.deliveredSuccess")}</p>
            ) : (
              isCod && <p>{t("paid.receive")}</p>
            )}
          </TrackStep>
        </ol>
      </section>
    </PageContainer>
  );
};

export default observer(TrackOrderContainer);
