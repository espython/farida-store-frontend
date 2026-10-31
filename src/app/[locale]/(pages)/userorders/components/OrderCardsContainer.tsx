"use client";
import React, { useContext, useEffect, useState } from "react";
import OrderCard from "./OrderCard";
import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import EmptyOrders from "./EmptyOrders";
import PageSkeleton from "@/components/feedback/PageSkeleton";

const OrderCardsContainer = () => {
  const { userOrders } = useContext(StoreContext);
  // Skeleton until the first fetch settles, so "no orders" does not flash.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    userOrders.getUserOrders().finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded && !(userOrders?.userOrders?.length > 0)) return <PageSkeleton variant="list" />;

  return (
    <>
      {userOrders?.userOrders?.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {userOrders.userOrders.map((order) => (
            <li key={order.id}>
              <OrderCard
                totalPrice={order.total}
                orderNumber={order.id}
                orderedOn={order.createdAt}
                arrivedOn={order.arrivedAt}
                orderItemsCount={order.order_items?.length || 0}
                status={order.status}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyOrders />
      )}
    </>
  );
};

export default observer(OrderCardsContainer);
