"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pagination } from "@nextui-org/react";
import { useOrders } from "../application/useOrders";
import OrderCard from "./OrderCard";
import { NoOrders, OrderLoading, OrdersSignIn, OrdersUnavailable } from "./OrderStates";

/** The customer's orders, newest first, a page at a time. */
const OrderList = () => {
  const t = useTranslations("orders.list");
  const [pageNumber, setPageNumber] = useState(1);
  const { page, loading, failed, signedOut, retry } = useOrders(pageNumber);

  if (signedOut) return <OrdersSignIn />;
  if (loading) return <OrderLoading tall />;
  if (failed || !page) return <OrdersUnavailable retry={retry} />;
  if (page.total === 0) return <NoOrders />;

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {page.orders.map((order) => (
          <li key={order.id}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>
      {page.totalPages > 1 && (
        <nav aria-label={t("pagination")} className="flex justify-center">
          <Pagination
            showControls
            color="success"
            total={page.totalPages}
            page={pageNumber}
            variant="faded"
            onChange={(next) => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setPageNumber(next);
            }}
            classNames={{ cursor: "bg-garden text-cream" }}
          />
        </nav>
      )}
    </div>
  );
};

export default OrderList;
