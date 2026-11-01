import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { emptyWishlist, removeProduct, saveProduct, type Wishlist } from "../domain/Wishlist";

export const WISHLIST_KEY = "wishlist" as const;

/** A guest's wishlist (the browser's). A signed-in customer's lives on their account (wishlistApi). */
export interface WishlistState {
  wishlist: Wishlist;
  /** False until storage has been read (after mount, never during render). */
  hydrated: boolean;
}

export const initialWishlistState: WishlistState = { wishlist: emptyWishlist(), hydrated: false };

// Reducers delegate to the domain; a refused save (full, invalid) leaves the list as it is.
const slice = createSlice({
  name: "wishlist",
  initialState: initialWishlistState,
  reducers: {
    wishlistHydrated(state, a: PayloadAction<Wishlist>) {
      state.wishlist = a.payload;
      state.hydrated = true;
    },
    productSaved(state, a: PayloadAction<{ productId: string }>) {
      const r = saveProduct(state.wishlist, a.payload.productId);
      if (r.ok) state.wishlist = r.wishlist;
    },
    productRemoved(state, a: PayloadAction<{ productId: string }>) {
      state.wishlist = removeProduct(state.wishlist, a.payload.productId);
    },
    wishlistCleared(state) {
      state.wishlist = emptyWishlist();
    },
  },
});

/** Event-named actions, so other contexts can listen without importing internals. */
export const wishlistActions = slice.actions;
export const wishlistReducer = slice.reducer;

type WithWishlist = { [WISHLIST_KEY]: WishlistState };
export const selectGuestWishlist = (s: WithWishlist) => s[WISHLIST_KEY].wishlist;
export const selectWishlistHydrated = (s: WithWishlist) => s[WISHLIST_KEY].hydrated;
