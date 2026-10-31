import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { CartLine, CartTotals, ProductRef } from "../domain/cart";
import { cartActions } from "./cartSlice";
import { selectCartHydrated, selectCartLines, selectCartTotals } from "./selectors";

export interface UseCart {
  lines: CartLine[];
  totals: CartTotals;
  /** False until the stored cart is loaded; render counts and badges only after that. */
  hydrated: boolean;
  add: (product: ProductRef, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  quantityOf: (productId: string) => number;
}

/**
 * The cart use cases for UI. Components call this, never the slice actions,
 * so C2 can switch a signed-in shopper to the server cart (Store API) behind
 * the same interface.
 */
export const useCart = (): UseCart => {
  const dispatch = useDispatch();
  const lines = useSelector(selectCartLines);
  const totals = useSelector(selectCartTotals);
  const hydrated = useSelector(selectCartHydrated);

  const add = useCallback(
    (product: ProductRef, quantity = 1) => dispatch(cartActions.itemAdded({ product, quantity })),
    [dispatch]
  );
  const setQuantity = useCallback(
    (productId: string, quantity: number) => dispatch(cartActions.quantityChanged({ productId, quantity })),
    [dispatch]
  );
  const remove = useCallback((productId: string) => dispatch(cartActions.itemRemoved({ productId })), [dispatch]);
  const clear = useCallback(() => dispatch(cartActions.cartCleared()), [dispatch]);
  const quantityOf = useCallback(
    (productId: string) => lines.find((l) => l.product.id === productId)?.quantity ?? 0,
    [lines]
  );

  return useMemo(
    () => ({ lines, totals, hydrated, add, setQuantity, remove, clear, quantityOf }),
    [lines, totals, hydrated, add, setQuantity, remove, clear, quantityOf]
  );
};
