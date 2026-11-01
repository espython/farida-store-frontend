"use client";
import { useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";
import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import { useOrder } from "../application/useOrders";
import OrderOverview from "./OrderOverview";
import { OrderLoading, OrderNotFound, OrdersSignIn, OrdersUnavailable } from "./OrderStates";

/** The order page: one of the customer's orders, read from Woo. */
const OrderDetail = ({ orderId }: { orderId: string }) => {
  const t = useTranslations("orders");
  const { order, loading, notFound, failed, signedOut, retry } = useOrder(orderId);

  if (signedOut) return <OrdersSignIn />;
  if (loading) return <OrderLoading tall />;
  if (failed) return <OrdersUnavailable retry={retry} />;
  if (notFound || !order) return <OrderNotFound />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/userorders" className={buttonClass({ variant: "ghost" })}>
          <LuArrowLeft aria-hidden="true" className="rtl:rotate-180" />
          {t("details.back")}
        </Link>
        <Link href={`/trackorder/${order.id}`} className={buttonClass()}>
          {t("details.track")}
        </Link>
      </div>
      <OrderOverview order={order} />
    </div>
  );
};

export default OrderDetail;
