"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "@/modules/customer";
import { emptyWishlist, hasProduct, isFull } from "../domain/Wishlist";
import { selectGuestWishlist, selectWishlistHydrated, wishlistActions } from "./wishlistSlice";
import { wishlistApi } from "./wishlistApi";

/** `full`: at the limit; `unavailable`: the shop could not be reached (saved list only). */
export type WishlistChange = { ok: true } | { ok: false; code: "full" | "not_found" | "unavailable" };

const EMPTY = emptyWishlist().productIds;

const failure = (error: unknown): WishlistChange => {
  const code = (error as { data?: { error?: { code?: string } } })?.data?.error?.code;
  return { ok: false, code: code === "wishlist_full" ? "full" : code === "not_found" ? "not_found" : "unavailable" };
};

/**
 * The wishlist use cases for UI. A guest's list lives in the browser; a
 * signed-in customer's on their account (it follows them across devices).
 * Components never see which one they use.
 */
export const useWishlist = () => {
  const dispatch = useDispatch();
  const { status } = useSession();
  const server = status === "signedIn";

  const guest = useSelector(selectGuestWishlist);
  const guestHydrated = useSelector(selectWishlistHydrated);
  const { data: saved, isSuccess } = wishlistApi.useGetWishlistQuery(undefined, { skip: !server });
  const [save, saveState] = wishlistApi.useSaveToWishlistMutation();
  const [remove, removeState] = wishlistApi.useRemoveFromWishlistMutation();

  // Render the empty list until mounted, so the first client render matches the server HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ready = mounted && status !== "loading";
  const productIds = !ready ? EMPTY : server ? saved?.productIds ?? EMPTY : guest.productIds;
  const hydrated = ready && (server ? isSuccess : guestHydrated);

  const has = useCallback((id: string) => productIds.includes(id), [productIds]);

  const toggle = useCallback(
    async (productId: string): Promise<WishlistChange> => {
      const list = { productIds };
      const saving = !hasProduct(list, productId);
      if (saving && isFull(list)) return { ok: false, code: "full" };
      if (!server) {
        dispatch(saving ? wishlistActions.productSaved({ productId }) : wishlistActions.productRemoved({ productId }));
        return { ok: true };
      }
      try {
        await (saving ? save(productId) : remove(productId)).unwrap();
        return { ok: true };
      } catch (error) {
        return failure(error);
      }
    },
    [productIds, server, dispatch, save, remove]
  );

  return useMemo(
    () => ({
      productIds,
      count: productIds.length,
      hydrated,
      pending: saveState.isLoading || removeState.isLoading,
      source: server ? ("account" as const) : ("browser" as const),
      has,
      toggle,
    }),
    [productIds, hydrated, saveState.isLoading, removeState.isLoading, server, has, toggle]
  );
};
