"use client";
import { useTranslations } from "next-intl";
import { LuCheck, LuPackageX } from "react-icons/lu";
import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { OrderLoading, OrderOverview, OrdersUnavailable, useOrder } from "@/modules/orders";

/** Step 4: the order Woo accepted, read back from Woo (owner only) through the orders context. */
const OrderConfirmation = ({ orderId }: { orderId: string | null }) => {
  const t = useTranslations("checkout");
  const { order, loading, notFound, failed, retry } = useOrder(orderId);

  if (loading) return <OrderLoading tall />;
  if (failed) return <OrdersUnavailable retry={retry} />;
  if (notFound || !order) {
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
      <OrderOverview order={order} showStatus={false} />
    </div>
  );
};

export default OrderConfirmation;
