"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "@/modules/customer";
import { cartTotals, emptyCart, type CartLine, type CartTotals, type ProductRef } from "../domain/cart";
import { cartActions } from "./cartSlice";
import { selectCartHydrated, selectCartLines, selectCartTotals } from "./selectors";
import { cartApi } from "./cartApi";

/** Why the shop refused a change: Woo's code (e.g. out of stock), or "unavailable". */
export type CartChange = { ok: true } | { ok: false; code: string };

export interface UseCart {
  lines: CartLine[];
  totals: CartTotals;
  /** False until the cart is known; render counts and badges only after that. */
  hydrated: boolean;
  /** "server" for a signed-in customer's saved cart, "guest" for the browser cart. */
  source: "guest" | "server";
  /** A change is on its way to the shop (server cart only). */
  pending: boolean;
  add: (product: ProductRef, quantity?: number) => Promise<CartChange>;
  setQuantity: (productId: string, quantity: number) => Promise<CartChange>;
  remove: (productId: string) => Promise<CartChange>;
  clear: () => Promise<CartChange>;
  quantityOf: (productId: string) => number;
}

const EMPTY_LINES: CartLine[] = emptyCart().lines;
const EMPTY_TOTALS = cartTotals(emptyCart());
const OK: CartChange = { ok: true };

const failure = (error: unknown): CartChange => {
  const code = (error as { data?: { error?: { code?: string } } })?.data?.error?.code;
  return { ok: false, code: code ?? "unavailable" };
};
const run = async (p: { unwrap: () => Promise<unknown> }): Promise<CartChange> => {
  try {
    await p.unwrap();
    return OK;
  } catch (error) {
    return failure(error);
  }
};

/**
 * The cart use cases for UI. A guest's cart lives in the browser (slice +
 * storage); a signed-in customer's is their saved Woo cart (cart follows
 * them across devices). Components never see which one they use.
 */
export const useCart = (): UseCart => {
  const dispatch = useDispatch();
  const { status } = useSession();
  const server = status === "signedIn";

  // Guest cart.
  const guestLines = useSelector(selectCartLines);
  const guestTotals = useSelector(selectCartTotals);
  const guestHydrated = useSelector(selectCartHydrated);

  // Saved cart.
  const { data: serverCart, isSuccess } = cartApi.useGetServerCartQuery(undefined, { skip: !server });
  const [addServer, addState] = cartApi.useAddServerItemMutation();
  const [setServer, setState] = cartApi.useSetServerQuantityMutation();
  const [removeServer, removeState] = cartApi.useRemoveServerItemMutation();
  const [clearServer, clearState] = cartApi.useClearServerCartMutation();

  // The server renders an empty, not-yet-loaded cart. A component that
  // hydrates late (behind a Suspense/loading boundary) can find the stored
  // cart already loaded by then, so each consumer shows the empty view until
  // it has mounted itself; otherwise its first render would not match the
  // server HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const serverLines = serverCart?.lines ?? EMPTY_LINES;
  const serverTotals = useMemo(() => cartTotals({ lines: serverLines }), [serverLines]);

  const lines = !mounted || status === "loading" ? EMPTY_LINES : server ? serverLines : guestLines;
  const totals = !mounted || status === "loading" ? EMPTY_TOTALS : server ? serverTotals : guestTotals;
  const hydrated = mounted && status !== "loading" && (server ? isSuccess : guestHydrated);
  const pending = addState.isLoading || setState.isLoading || removeState.isLoading || clearState.isLoading;

  const add = useCallback(
    async (product: ProductRef, quantity = 1) => {
      if (server) return run(addServer({ productId: product.id, quantity }));
      dispatch(cartActions.itemAdded({ product, quantity }));
      return OK;
    },
    [server, addServer, dispatch]
  );
  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (server) return run(setServer({ productId, quantity: Math.max(0, Math.floor(quantity) || 0) }));
      dispatch(cartActions.quantityChanged({ productId, quantity }));
      return OK;
    },
    [server, setServer, dispatch]
  );
  const remove = useCallback(
    async (productId: string) => {
      if (server) return run(removeServer({ productId }));
      dispatch(cartActions.itemRemoved({ productId }));
      return OK;
    },
    [server, removeServer, dispatch]
  );
  const clear = useCallback(async () => {
    if (server) return run(clearServer());
    dispatch(cartActions.cartCleared());
    return OK;
  }, [server, clearServer, dispatch]);
  const quantityOf = useCallback(
    (productId: string) => lines.find((l) => l.product.id === productId)?.quantity ?? 0,
    [lines]
  );

  return useMemo(
    () => ({ lines, totals, hydrated, source: server ? ("server" as const) : ("guest" as const), pending, add, setQuantity, remove, clear, quantityOf }),
    [lines, totals, hydrated, server, pending, add, setQuantity, remove, clear, quantityOf]
  );
};
