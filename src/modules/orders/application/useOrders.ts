"use client";
import { useSession } from "@/modules/customer";
import { ordersApi } from "./ordersApi";

const notFound = (error: unknown) => (error as { status?: unknown } | undefined)?.status === 404;

/** A page of the customer's orders. `failed` is the shop being unreachable, not "no orders". */
export const useOrders = (page: number) => {
  const { status } = useSession();
  const q = ordersApi.useListOrdersQuery(page, { skip: status !== "signedIn" });
  return {
    page: q.data ?? null,
    signedOut: status === "signedOut",
    loading: status === "loading" || q.isLoading,
    failed: q.isError,
    retry: q.refetch,
  };
};

/** One of the customer's orders; someone else's or an unknown number is `notFound`. */
export const useOrder = (id: string | null) => {
  const { status } = useSession();
  const q = ordersApi.useGetOrderQuery(id ?? "", { skip: !id || status !== "signedIn" });
  return {
    order: q.data ?? null,
    signedOut: status === "signedOut",
    loading: Boolean(id) && (status === "loading" || q.isLoading),
    notFound: !id || (q.isError && notFound(q.error)),
    failed: q.isError && !notFound(q.error),
    retry: q.refetch,
  };
};
