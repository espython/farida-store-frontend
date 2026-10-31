"use client";
import { useLocale, useTranslations } from "next-intl";
import { LuCheck, LuPackageX } from "react-icons/lu";
import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { governorateName } from "../domain/governorates";
import { usePlacedOrder } from "../application/useCheckout";
import CheckoutSummary from "./CheckoutSummary";
import { CheckoutLoading } from "./CheckoutStates";

/** Step 4: the order Woo accepted, read back from Woo (owner only). */
const OrderConfirmation = ({ orderId }: { orderId: string | null }) => {
  const t = useTranslations("checkout");
  const locale = useLocale() as "en" | "ar";
  const { order, loading, notFound } = usePlacedOrder(orderId);

  if (orderId && loading) return <CheckoutLoading />;
  if (!orderId || notFound || !order) {
    return (
      <EmptyState
        role="status"
        icon={<LuPackageX />}
        title={t("confirmation.notFound")}
        action={
          <Link href="/userorders" className={buttonClass()}>
            {t("confirmation.myOrders")}
          </Link>
        }
      />
    );
  }

  const a = order.address;
  const date = new Date(order.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section aria-labelledby="order-thanks" className="flex flex-col items-center text-center gap-3 px-6 py-10 md:py-12 bg-white rounded-3xl">
        <span className="w-16 h-16 grid place-items-center rounded-full bg-garden text-cream text-3xl" aria-hidden="true">
          <LuCheck />
        </span>
        <h2 id="order-thanks" className="font-display text-[1.75rem] md:text-[2.75rem] leading-tight">
          {t("confirmation.thanks")}
        </h2>
        <p className="text-garden-muted max-w-md">{t("confirmation.text", { number: order.id })}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          <Link href={`/trackorder/${order.id}`} className={buttonClass()}>
            {t("confirmation.track")}
          </Link>
          <Link href="/" className={buttonClass({ variant: "outline" })}>
            {t("confirmation.continue")}
          </Link>
        </div>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section aria-labelledby="order-details" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
            <h2 id="order-details" className="font-display text-xl md:text-2xl">
              {t("confirmation.details")}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                [t("confirmation.number"), `#${order.id}`],
                [t("confirmation.date"), date],
                [t("confirmation.payment"), t(order.paymentMethod === "cod" ? "payment.methods.cod.title" : "payment.methods.card.title")],
                [t("confirmation.deliverTo"), `${a.firstName} ${a.lastName}`],
                [t("fields.phone"), a.phone],
                [t("confirmation.address"), `${[a.address1, a.address2, a.city].filter(Boolean).join(", ")} — ${governorateName(a.state, locale)}`],
                ...(order.note ? [[t("payment.note"), order.note]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5 min-w-0">
                  <dt className="text-sm text-garden-muted">{label}</dt>
                  <dd className="font-semibold break-words">
                    <bdi>{value}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
            {order.paymentMethod === "cod" && (
              <p className="rounded-2xl bg-[#fbe9c4] text-saffron-ink p-4 text-sm">{t("confirmation.codNote")}</p>
            )}
          </section>
        </div>
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <CheckoutSummary
            lines={order.lines.map((l, i) => ({ key: `${i}`, title: l.title, quantity: l.quantity, total: l.total, image: l.image }))}
            totals={order.totals}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
