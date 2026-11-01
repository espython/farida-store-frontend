"use client";
import { isAnyOf, type ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadWishlist, saveWishlist, WISHLIST_STORAGE_KEY } from "../infrastructure/wishlistStorage";
import { selectGuestWishlist, wishlistActions } from "./wishlistSlice";

const { productSaved, productRemoved, wishlistCleared, wishlistHydrated } = wishlistActions;

/** Write the guest wishlist to storage after each change made in this tab (not on hydrate: that came from storage). */
export const startWishlistPersistence = (listener: ListenerMiddlewareInstance) =>
  listener.startListening({
    matcher: isAnyOf(productSaved, productRemoved, wishlistCleared),
    effect: (_action, api) => {
      saveWishlist(selectGuestWishlist(api.getState() as Parameters<typeof selectGuestWishlist>[0]));
    },
  });

/** Read the stored list after the first render (markup matches the server) and follow other tabs. */
export const useWishlistPersistence = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(wishlistHydrated(loadWishlist()));
    const onStorage = (e: StorageEvent) => {
      if (e.key === WISHLIST_STORAGE_KEY || e.key === null) dispatch(wishlistHydrated(loadWishlist()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);
};
