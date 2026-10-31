import { createSelector } from "@reduxjs/toolkit";
import { cartTotals } from "../domain/cart";
import { CART_KEY, type CartState } from "./cartSlice";

// Structural root so the module does not import the store (composition root).
type WithCart = { [CART_KEY]: CartState };

export const selectCart = (state: WithCart) => state[CART_KEY].cart;
export const selectCartLines = (state: WithCart) => state[CART_KEY].cart.lines;
export const selectCartHydrated = (state: WithCart) => state[CART_KEY].hydrated;
export const selectCartTotals = createSelector(selectCart, cartTotals);
export const selectCartCount = (state: WithCart) => selectCartTotals(state).itemCount;
export const selectCartLine = (state: WithCart, productId: string) =>
  selectCartLines(state).find((l) => l.product.id === productId);
