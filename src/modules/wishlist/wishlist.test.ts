import { afterEach, describe, expect, it } from "vitest";
import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { emptyWishlist, hasProduct, MAX_WISHLIST, mergeWishlists, removeProduct, saveProduct, toWishlist } from "./domain/Wishlist";
import { selectGuestWishlist, WISHLIST_KEY, wishlistActions, wishlistReducer } from "./application/wishlistSlice";
import { startWishlistPersistence } from "./application/wishlistPersistence";
import { loadWishlist, WISHLIST_STORAGE_KEY } from "./infrastructure/wishlistStorage";

const ids = (n: number, from = 1) => Array.from({ length: n }, (_, i) => String(from + i));

describe("Wishlist", () => {
  it("saves newest first, once, and only real product ids", () => {
    const one = saveProduct(emptyWishlist(), "12");
    expect(one).toEqual({ ok: true, wishlist: { productIds: ["12"] } });
    const two = one.ok ? saveProduct(one.wishlist, "7") : one;
    expect(two.ok && two.wishlist.productIds).toEqual(["7", "12"]);
    expect(two.ok && saveProduct(two.wishlist, "12")).toEqual({ ok: true, wishlist: { productIds: ["7", "12"] } });
    expect(saveProduct(emptyWishlist(), "0")).toEqual({ ok: false, error: "invalid" });
    expect(saveProduct(emptyWishlist(), "1/../2")).toEqual({ ok: false, error: "invalid" });
  });

  it("refuses a product past the limit and removes", () => {
    const full = { productIds: ids(MAX_WISHLIST) };
    expect(saveProduct(full, "999")).toEqual({ ok: false, error: "full" });
    expect(saveProduct(full, "1").ok).toBe(true);
    expect(hasProduct(removeProduct(full, "1"), "1")).toBe(false);
  });

  it("merges a guest list in front of the saved one, up to the limit", () => {
    expect(mergeWishlists({ productIds: ["1", "2"] }, { productIds: ["3", "2", "3", "x"] })).toEqual({ wishlist: { productIds: ["3", "1", "2"] }, added: 1, skipped: 0 });
    const r = mergeWishlists({ productIds: ids(MAX_WISHLIST - 1) }, { productIds: ["900", "901", "902"] });
    expect(r).toMatchObject({ added: 1, skipped: 2 });
    expect(r.wishlist.productIds).toHaveLength(MAX_WISHLIST);
  });

  it("cleans untrusted ids", () => {
    expect(toWishlist(["3", 3, "a", "-1", "4"])).toEqual({ productIds: ["3", "4"] });
    expect(toWishlist("nope")).toEqual(emptyWishlist());
    expect(toWishlist(ids(MAX_WISHLIST + 5)).productIds).toHaveLength(MAX_WISHLIST);
  });
});

describe("guest wishlist slice and storage", () => {
  afterEach(() => localStorage.clear());

  const store = () => {
    const listener = createListenerMiddleware();
    startWishlistPersistence(listener);
    return configureStore({ reducer: { [WISHLIST_KEY]: wishlistReducer }, middleware: (d) => d().prepend(listener.middleware) });
  };

  it("keeps the browser list in storage", () => {
    const s = store();
    s.dispatch(wishlistActions.productSaved({ productId: "5" }));
    s.dispatch(wishlistActions.productSaved({ productId: "9" }));
    s.dispatch(wishlistActions.productRemoved({ productId: "5" }));
    expect(selectGuestWishlist(s.getState()).productIds).toEqual(["9"]);
    expect(JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) ?? "{}")).toEqual({ v: 1, ids: ["9"] });
    expect(loadWishlist()).toEqual({ productIds: ["9"] });
    s.dispatch(wishlistActions.wishlistCleared());
    expect(localStorage.getItem(WISHLIST_STORAGE_KEY)).toBeNull();
  });

  it("ignores a full or invalid save and survives broken storage", () => {
    const s = store();
    s.dispatch(wishlistActions.wishlistHydrated({ productIds: ids(MAX_WISHLIST) }));
    s.dispatch(wishlistActions.productSaved({ productId: "999" }));
    s.dispatch(wishlistActions.productSaved({ productId: "abc" }));
    expect(selectGuestWishlist(s.getState()).productIds).toHaveLength(MAX_WISHLIST);
    localStorage.setItem(WISHLIST_STORAGE_KEY, "{broken");
    expect(loadWishlist()).toEqual(emptyWishlist());
  });
});
