import { isAnyOf, type ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { CART_STORAGE_KEY, loadCart, saveCart } from "../infrastructure/cartStorage";
import { cartActions } from "./cartSlice";
import { selectCart } from "./selectors";

const { itemAdded, quantityChanged, itemRemoved, cartCleared, cartHydrated } = cartActions;

/**
 * Write the guest cart to storage after every change made in this tab.
 * cartHydrated is left out: it comes from storage, so writing it back would
 * only bounce between tabs.
 */
export const startCartPersistence = (listener: ListenerMiddlewareInstance) =>
  listener.startListening({
    matcher: isAnyOf(itemAdded, quantityChanged, itemRemoved, cartCleared),
    effect: (_action, api) => {
      saveCart(selectCart(api.getState() as Parameters<typeof selectCart>[0]));
    },
  });

/**
 * Mount once near the root (client only). Reads the stored cart after the
 * first render, so server and client markup match, and follows changes made
 * in other tabs.
 */
export const useCartPersistence = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(cartHydrated(loadCart()));
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY || e.key === null) dispatch(cartHydrated(loadCart()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);
};
