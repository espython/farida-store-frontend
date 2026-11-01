"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "@/modules/customer";
import { selectGuestWishlist, selectWishlistHydrated, wishlistActions } from "./wishlistSlice";
import { wishlistApi } from "./wishlistApi";

export type WishlistMergeOutcome = { status: "merged"; count: number; skipped: number } | { status: "failed" };

/**
 * Signed in with products saved in the browser → move them to the account
 * once, then empty the browser list. A failed merge keeps the browser list
 * (nothing is lost) and is retried on the next page load.
 */
export const useGuestWishlistMerge = (): WishlistMergeOutcome | null => {
  const dispatch = useDispatch();
  const { status } = useSession();
  const guest = useSelector(selectGuestWishlist);
  const hydrated = useSelector(selectWishlistHydrated);
  const [merge] = wishlistApi.useMergeGuestWishlistMutation();
  const started = useRef(false);
  const [outcome, setOutcome] = useState<WishlistMergeOutcome | null>(null);

  useEffect(() => {
    if (status !== "signedIn" || !hydrated || guest.productIds.length === 0 || started.current) return;
    started.current = true;
    const ids = guest.productIds;
    merge(ids)
      .unwrap()
      .then(({ skipped }) => {
        dispatch(wishlistActions.wishlistCleared());
        setOutcome({ status: "merged", count: ids.length - skipped, skipped });
      })
      .catch(() => setOutcome({ status: "failed" }));
  }, [status, hydrated, guest, merge, dispatch]);

  return outcome;
};
