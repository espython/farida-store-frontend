import { createSlice, type PayloadAction, type ThunkAction, type UnknownAction } from "@reduxjs/toolkit";

/**
 * Shell UI state: which drawer is open, the header dropdowns, the products
 * view and the search text. Not a domain; nothing here is persisted.
 *
 * A drawer opens in two steps (backdrop, then the panel slides in 500 ms
 * later) and closes in reverse, so the slide animations do not overlap.
 */
export const UI_KEY = "ui" as const;

export const DRAWERS = ["menu", "cart", "filters", "search"] as const;
export type Drawer = (typeof DRAWERS)[number];
export type ProductsView = "grid" | "list";
export const DRAWER_SLIDE_MS = 500;

interface DrawerState {
  backdrop: boolean;
  open: boolean;
  /** Bumped by every open or close request; a delayed step only runs if no newer request came. */
  version: number;
}

export interface UiState {
  drawers: Record<Drawer, DrawerState>;
  /** Header dropdowns (desktop hover). */
  cartMenu: boolean;
  userMenu: boolean;
  productsView: ProductsView;
  searchQuery: string;
}

const closed = (): DrawerState => ({ backdrop: false, open: false, version: 0 });

export const initialUiState = (): UiState => ({
  drawers: { menu: closed(), cart: closed(), filters: closed(), search: closed() },
  cartMenu: false,
  userMenu: false,
  productsView: "grid",
  searchQuery: "",
});

const uiSlice = createSlice({
  name: UI_KEY,
  initialState: initialUiState,
  reducers: {
    drawerBackdropShown: (s, a: PayloadAction<Drawer>) => {
      s.drawers[a.payload].backdrop = true;
      s.drawers[a.payload].version += 1;
    },
    drawerSlidIn: (s, a: PayloadAction<Drawer>) => {
      s.drawers[a.payload].open = true;
    },
    drawerSlidOut: (s, a: PayloadAction<Drawer>) => {
      s.drawers[a.payload].open = false;
      s.drawers[a.payload].version += 1;
    },
    drawerBackdropHidden: (s, a: PayloadAction<Drawer>) => {
      s.drawers[a.payload].backdrop = false;
    },
    cartMenuShown: (s) => {
      s.cartMenu = true;
    },
    cartMenuHidden: (s) => {
      s.cartMenu = false;
    },
    userMenuShown: (s) => {
      s.userMenu = true;
    },
    userMenuHidden: (s) => {
      s.userMenu = false;
    },
    productsViewChosen: (s, a: PayloadAction<ProductsView>) => {
      s.productsView = a.payload;
    },
    searchQueryChanged: (s, a: PayloadAction<string>) => {
      s.searchQuery = a.payload;
    },
  },
});

export const uiReducer = uiSlice.reducer;
export const uiActions = uiSlice.actions;

type UiThunk = ThunkAction<void, { [UI_KEY]: UiState }, unknown, UnknownAction>;
const { drawerBackdropShown, drawerSlidIn, drawerSlidOut, drawerBackdropHidden } = uiSlice.actions;

const versionOf = (state: { [UI_KEY]: UiState }, name: Drawer) => state[UI_KEY].drawers[name].version;

/** Backdrop now, panel after the slide delay, unless the drawer was closed (or reopened) meanwhile. */
export const openDrawer =
  (name: Drawer): UiThunk =>
  (dispatch, getState) => {
    dispatch(drawerBackdropShown(name));
    const version = versionOf(getState(), name);
    setTimeout(() => {
      if (versionOf(getState(), name) === version) dispatch(drawerSlidIn(name));
    }, DRAWER_SLIDE_MS);
  };

/** Panel now, backdrop after the slide delay, unless the drawer was opened again meanwhile. */
export const closeDrawer =
  (name: Drawer): UiThunk =>
  (dispatch, getState) => {
    dispatch(drawerSlidOut(name));
    const version = versionOf(getState(), name);
    setTimeout(() => {
      if (versionOf(getState(), name) === version) dispatch(drawerBackdropHidden(name));
    }, DRAWER_SLIDE_MS);
  };

/** Drawers that lock the page scroll while their backdrop shows (the filters panel never did). */
export const SCROLL_LOCKING: readonly Drawer[] = ["menu", "cart", "search"];
