"use client";
import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import { closeDrawer, openDrawer, SCROLL_LOCKING, uiActions, UI_KEY, type Drawer, type ProductsView } from "./uiSlice";

/** One drawer: `backdrop` and `open` drive its two-step animation. */
export const useDrawer = (name: Drawer) => {
  const backdrop = useAppSelector((s) => s[UI_KEY].drawers[name].backdrop);
  const open = useAppSelector((s) => s[UI_KEY].drawers[name].open);
  const dispatch = useAppDispatch();
  const show = useCallback(() => dispatch(openDrawer(name)), [dispatch, name]);
  const hide = useCallback(() => dispatch(closeDrawer(name)), [dispatch, name]);
  return useMemo(() => ({ backdrop, open, show, hide }), [backdrop, open, show, hide]);
};

export const useCartMenu = () => {
  const shown = useAppSelector((s) => s[UI_KEY].cartMenu);
  const dispatch = useAppDispatch();
  return {
    shown,
    show: useCallback(() => dispatch(uiActions.cartMenuShown()), [dispatch]),
    hide: useCallback(() => dispatch(uiActions.cartMenuHidden()), [dispatch]),
  };
};

export const useUserMenu = () => {
  const shown = useAppSelector((s) => s[UI_KEY].userMenu);
  const dispatch = useAppDispatch();
  return {
    shown,
    show: useCallback(() => dispatch(uiActions.userMenuShown()), [dispatch]),
    hide: useCallback(() => dispatch(uiActions.userMenuHidden()), [dispatch]),
  };
};

export const useProductsView = () => {
  const view = useAppSelector((s) => s[UI_KEY].productsView);
  const dispatch = useAppDispatch();
  return { view, choose: useCallback((v: ProductsView) => dispatch(uiActions.productsViewChosen(v)), [dispatch]) };
};

export const useSearchQuery = () => {
  const query = useAppSelector((s) => s[UI_KEY].searchQuery);
  const dispatch = useAppDispatch();
  return { query, setQuery: useCallback((q: string) => dispatch(uiActions.searchQueryChanged(q)), [dispatch]) };
};

/** Locks the page scroll while the menu, cart or search drawer's backdrop shows. */
export const ScrollLock = () => {
  const locked = useAppSelector((s) => SCROLL_LOCKING.some((d) => s[UI_KEY].drawers[d].backdrop));
  useEffect(() => {
    document.body.style.overflow = locked ? "hidden" : "unset";
  }, [locked]);
  return null;
};
