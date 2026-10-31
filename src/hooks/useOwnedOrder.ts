"use client";
import { useContext, useEffect, useState } from "react";
import { StoreContext } from "@/contexts/StoreContext";

export type OwnedOrderState = "loading" | "allowed" | "denied";

/**
 * Loads an order into `userOrders.orderDetails` and says whether it belongs to
 * the signed-in user. The pages compared the two ids directly, so while both
 * were still undefined they matched and rendered an empty order (or a
 * timeline for an order that does not exist).
 */
export const useOwnedOrder = (orderId: string): OwnedOrderState => {
  const { userOrders, user } = useContext(StoreContext);
  const [fetched, setFetched] = useState<"pending" | "found" | "missing">("pending");

  useEffect(() => {
    let cancelled = false;
    userOrders
      .getOrderDetails(orderId)
      .then((order) => !cancelled && setFetched(order?.data ? "found" : "missing"))
      .catch(() => !cancelled && setFetched("missing"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const ownerId = userOrders.orderDetails.data?.attributes?.user?.data?.id;
  const userId = user.strapiUserdata?.id;

  if (fetched === "pending") return "loading";
  if (fetched === "missing" || ownerId === undefined) return "denied";
  if (userId === undefined) return "loading";
  return ownerId === userId && String(userOrders.orderDetails.data?.id) === orderId ? "allowed" : "denied";
};
