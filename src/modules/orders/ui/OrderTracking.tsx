"use client";
import { useLocale, useTranslations } from "next-intl";
import { LuAlertCircle } from "react-icons/lu";
import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import { trackingOf } from "../domain/Order";
import { useOrder } from "../application/useOrders";
import OrderStatusBadge from "./OrderStatusBadge";
import TrackStep from "./TrackStep";
import { OrderLoading, OrderNotFound, OrdersSignIn, OrdersUnavailable } from "./OrderStates";
import { formatAddress, formatDate } from "./format";

/** Where the order is: a timeline from Woo's status, or the status if it left the delivery flow. */
const OrderTracking = ({ orderId }: { orderId: string }) => {
  const t = useTranslations("orders");
  const tt = useTranslations("orders.tracking");
  const locale = useLocale() as "en" | "ar";
  const { order, loading, notFound, failed, signedOut, retry } = useOrder(orderId);

  if (signedOut) return <OrdersSignIn />;
  if (loading) return <OrderLoading />;
  if (failed) return <OrdersUnavailable retry={retry} />;
  if (notFound || !order) return <OrderNotFound />;

  const steps = trackingOf(order.status);
  const stateOf = (step: string) => steps?.find((s) => s.step === step)?.state ?? "upcoming";
  const address = formatAddress(order.address, locale, t("details.separator"));

  return (
    <section aria-labelledby="track-heading" className="max-w-2xl mx-auto bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="track-heading" className="font-display text-xl md:text-2xl">
            {t("order", { number: order.id })}
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <Link href={`/order/${order.id}`} className={buttonClass({ variant: "ghost" })}>
          {tt("details")}
        </Link>
      </div>

      {steps ? (
        <ol>
          <TrackStep index={1} state={stateOf("placed")} title={tt("placed.title")} stateLabel={tt(`stepState.${stateOf("placed")}`)}>
            <p>{tt("placed.text", { date: formatDate(order.createdAt, locale) })}</p>
            {address && (
              <p className="text-sm">
                {tt("placed.address")} <bdi className="font-semibold text-garden">{address}</bdi>
              </p>
            )}
          </TrackStep>
          <TrackStep
            index={2}
            state={stateOf("out_for_delivery")}
            title={tt("out_for_delivery.title")}
            stateLabel={tt(`stepState.${stateOf("out_for_delivery")}`)}
          >
            {stateOf("out_for_delivery") !== "done" && (
              <p>{tt(stateOf("out_for_delivery") === "current" ? "out_for_delivery.current" : "out_for_delivery.upcoming")}</p>
            )}
          </TrackStep>
          <TrackStep index={3} state={stateOf("delivered")} title={tt("delivered.title")} stateLabel={tt(`stepState.${stateOf("delivered")}`)} last>
            {order.status === "delivered" ? (
              <p>{order.deliveredAt ? tt("delivered.done", { date: formatDate(order.deliveredAt, locale) }) : tt("delivered.doneNoDate")}</p>
            ) : (
              order.payment === "cod" && <p>{tt("delivered.cod")}</p>
            )}
          </TrackStep>
        </ol>
      ) : (
        <p role="status" className="flex items-start gap-3 rounded-2xl bg-sand p-4">
          <LuAlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-xl" />
          <span>{tt(`stopped.${order.status as "awaiting_payment" | "cancelled" | "refunded" | "failed"}`)}</span>
        </p>
      )}

      <p className="text-sm text-garden-muted">
        <Link href="/contact" className="underline hover:text-garden">
          {tt("help")}
        </Link>
      </p>
    </section>
  );
};

export default OrderTracking;
