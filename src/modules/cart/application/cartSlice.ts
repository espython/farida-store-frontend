import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { addLine, emptyCart, removeLine, setLineQuantity, type Cart, type ProductRef } from "../domain/cart";

export const CART_KEY = "cart" as const;

export interface CartState {
  /** The Cart aggregate; only changed through the domain functions. */
  cart: Cart;
  /** False until the stored guest cart has been read (after mount, never during render). */
  hydrated: boolean;
}

export const initialCartState: CartState = { cart: emptyCart(), hydrated: false };

// Reducers only delegate to domain/cart.ts, so the rules are tested once there.
const slice = createSlice({
  name: "cart",
  initialState: initialCartState,
  reducers: {
    /** Replace the cart with what storage (or another tab) holds. */
    cartHydrated(state, a: PayloadAction<Cart>) {
      state.cart = a.payload;
      state.hydrated = true;
    },
    itemAdded(state, a: PayloadAction<{ product: ProductRef; quantity?: number }>) {
      state.cart = addLine(state.cart, a.payload.product, a.payload.quantity ?? 1);
    },
    quantityChanged(state, a: PayloadAction<{ productId: string; quantity: number }>) {
      state.cart = setLineQuantity(state.cart, a.payload.productId, a.payload.quantity);
    },
    itemRemoved(state, a: PayloadAction<{ productId: string }>) {
      state.cart = removeLine(state.cart, a.payload.productId);
    },
    cartCleared(state) {
      state.cart = emptyCart();
    },
  },
});

/**
 * Actions are named as events ("itemAdded"), so other contexts can react to
 * them through listener middleware (e.g. order placed → cartCleared) without
 * importing cart internals.
 */
export const cartActions = slice.actions;
export const cartReducer = slice.reducer;
