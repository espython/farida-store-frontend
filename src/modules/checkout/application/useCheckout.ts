"use client";
import { useCallback } from "react";
import { useSession } from "@/modules/customer";
import type { Address } from "@/shared/kernel/Address";
import type { PaymentMethod } from "../domain/Checkout";
import { clearIntentKey, intentKey } from "../infrastructure/intentKeyStore";
import { checkoutApi } from "./checkoutApi";
import { toCheckoutFailure, type CheckoutFailure } from "./checkoutFailure";

export type StepResult = { ok: true } | { ok: false; failure: CheckoutFailure };

const run = async (p: { unwrap: () => Promise<unknown> }): Promise<StepResult> => {
  try {
    await p.unwrap();
    return { ok: true };
  } catch (error) {
    return { ok: false, failure: toCheckoutFailure(error) };
  }
};

/** The checkout use cases for UI (signed-in customers only). */
export const useCheckout = () => {
  const { status, session } = useSession();
  const query = checkoutApi.useGetCheckoutQuery(undefined, { skip: status !== "signedIn" });
  const [saveAddress, saveState] = checkoutApi.useSaveAddressMutation();
  const [chooseRate, rateState] = checkoutApi.useChooseShippingRateMutation();
  const [applyCoupon, applyState] = checkoutApi.useApplyCouponMutation();
  const [removeCoupon, removeState] = checkoutApi.useRemoveCouponMutation();
  const [place, placeState] = checkoutApi.usePlaceOrderMutation();

  const placeOrder = useCallback(
    async (paymentMethod: PaymentMethod, note: string): Promise<{ ok: true; orderId: string } | { ok: false; failure: CheckoutFailure }> => {
      const c = query.data;
      if (!c || !session) return { ok: false, failure: { code: "unavailable", fields: {} } };
      // Same intent (items, address, method) → same key → Woo order placed once.
      const key = intentKey({
        customerId: session.customerId,
        items: c.lines.map((l) => ({ id: l.product.id, quantity: l.quantity })),
        addressKey: `${c.address.state}|${c.address.address1}`,
        paymentMethod,
      });
      try {
        const { orderId } = await place({ paymentMethod, note, key }).unwrap();
        clearIntentKey();
        return { ok: true, orderId };
      } catch (error) {
        return { ok: false, failure: toCheckoutFailure(error) };
      }
    },
    [query.data, session, place]
  );

  return {
    checkout: query.data ?? null,
    loading: status === "loading" || query.isLoading,
    signedIn: status === "signedIn",
    loadFailed: query.isError,
    busy: saveState.isLoading || rateState.isLoading || applyState.isLoading || removeState.isLoading,
    placing: placeState.isLoading,
    saveAddress: useCallback((a: Address) => run(saveAddress(a)), [saveAddress]),
    chooseRate: useCallback((id: string) => run(chooseRate(id)), [chooseRate]),
    applyCoupon: useCallback((code: string) => run(applyCoupon(code)), [applyCoupon]),
    removeCoupon: useCallback((code: string) => run(removeCoupon(code)), [removeCoupon]),
    placeOrder,
  };
};
