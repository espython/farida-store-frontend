"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "@/modules/customer";
import { cartActions } from "./cartSlice";
import { selectCartHydrated, selectCartLines } from "./selectors";
import { cartApi } from "./cartApi";

export type MergeOutcome =
  | { status: "merged"; count: number; skipped: number }
  | { status: "failed" };

/**
 * Customer signed in with items in the browser cart → move them into their
 * saved cart once, then empty the browser cart. A failed merge keeps the
 * browser cart so nothing is lost; it is retried on the next page load.
 */
export const useGuestCartMerge = (): MergeOutcome | null => {
  const dispatch = useDispatch();
  const { status } = useSession();
  const lines = useSelector(selectCartLines);
  const hydrated = useSelector(selectCartHydrated);
  const [merge] = cartApi.useMergeGuestCartMutation();
  const started = useRef(false);
  const [outcome, setOutcome] = useState<MergeOutcome | null>(null);

  useEffect(() => {
    if (status !== "signedIn" || !hydrated || lines.length === 0 || started.current) return;
    started.current = true;
    const payload = lines.map((l) => ({ productId: l.product.id, quantity: l.quantity }));
    merge({ lines: payload })
      .unwrap()
      .then(({ skipped }) => {
        dispatch(cartActions.cartCleared());
        setOutcome({ status: "merged", count: payload.length - skipped.length, skipped: skipped.length });
      })
      .catch(() => setOutcome({ status: "failed" }));
  }, [status, hydrated, lines, merge, dispatch]);

  return outcome;
};
