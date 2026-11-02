"use client";
import { useCallback, useMemo } from "react";
import { canCancel } from "../domain/cancellation";
import type { Order } from "../domain/Order";
import { canRequestReturn, returnDeadline, validateReturnRequest, type ReturnRequestErrors } from "../domain/ReturnRequest";
import { ordersApi } from "./ordersApi";

export type CancelResult = { ok: true } | { ok: false; code: "not_cancellable" | "unavailable" };

export type ReturnResult =
  | { ok: true }
  | { ok: false; code: "invalid"; errors: ReturnRequestErrors }
  | { ok: false; code: "not_returnable" | "unavailable" };

const errorCode = (error: unknown) => (error as { data?: { error?: { code?: string; details?: unknown } } })?.data?.error;

/**
 * What the customer can still do with an order: cancel it before it is sent
 * out, or ask to return it within the return window. The server re-checks
 * both; when it refuses (the shop moved the order meanwhile) the order is read
 * again so the page shows where it is now.
 */
export const useOrderActions = (order: Order) => {
  const [cancelMutation, cancelState] = ordersApi.useCancelOrderMutation();
  const [returnMutation, returnState] = ordersApi.useRequestReturnMutation();
  const [refetch] = ordersApi.useLazyGetOrderQuery();

  const deadline = useMemo(() => returnDeadline(order), [order]);
  // Evaluated at render: a page left open past the deadline is refused by the server.
  const returnable = canRequestReturn(order);

  const cancel = useCallback(async (): Promise<CancelResult> => {
    try {
      await cancelMutation(order.id).unwrap();
      return { ok: true };
    } catch (error) {
      if (errorCode(error)?.code === "not_cancellable") {
        refetch(order.id);
        return { ok: false, code: "not_cancellable" };
      }
      return { ok: false, code: "unavailable" };
    }
  }, [cancelMutation, refetch, order.id]);

  const requestReturn = useCallback(
    async (input: { reason: string; details: string }): Promise<ReturnResult> => {
      const result = validateReturnRequest(input);
      if (!result.ok) return { ok: false, code: "invalid", errors: result.errors };
      try {
        await returnMutation({ id: order.id, ...result.request }).unwrap();
        return { ok: true };
      } catch (error) {
        const body = errorCode(error);
        if (body?.code === "invalid_return") return { ok: false, code: "invalid", errors: (body.details as ReturnRequestErrors) ?? {} };
        if (body?.code === "not_returnable") {
          refetch(order.id);
          return { ok: false, code: "not_returnable" };
        }
        return { ok: false, code: "unavailable" };
      }
    },
    [returnMutation, refetch, order.id]
  );

  return {
    canCancel: canCancel(order),
    cancel,
    cancelling: cancelState.isLoading,
    canRequestReturn: returnable,
    returnDeadline: deadline,
    requestReturn,
    requestingReturn: returnState.isLoading,
  };
};
