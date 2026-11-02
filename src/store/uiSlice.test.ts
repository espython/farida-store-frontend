import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { closeDrawer, DRAWER_SLIDE_MS, openDrawer, uiActions, uiReducer, UI_KEY } from "./uiSlice";

const store = () => configureStore({ reducer: { [UI_KEY]: uiReducer } });

describe("uiSlice", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("opens a drawer in two steps: backdrop, then the panel", () => {
    const s = store();
    s.dispatch(openDrawer("cart"));
    expect(s.getState().ui.drawers.cart).toMatchObject({ backdrop: true, open: false });
    vi.advanceTimersByTime(DRAWER_SLIDE_MS);
    expect(s.getState().ui.drawers.cart).toMatchObject({ backdrop: true, open: true });
    expect(s.getState().ui.drawers.menu).toMatchObject({ backdrop: false, open: false });
  });

  it("closes in reverse: panel, then the backdrop", () => {
    const s = store();
    s.dispatch(openDrawer("menu"));
    vi.advanceTimersByTime(DRAWER_SLIDE_MS);
    s.dispatch(closeDrawer("menu"));
    expect(s.getState().ui.drawers.menu).toMatchObject({ backdrop: true, open: false });
    vi.advanceTimersByTime(DRAWER_SLIDE_MS);
    expect(s.getState().ui.drawers.menu).toMatchObject({ backdrop: false, open: false });
  });

  it("a quick open → close leaves it closed (no panel sliding in late)", () => {
    const s = store();
    s.dispatch(openDrawer("search"));
    s.dispatch(closeDrawer("search"));
    vi.advanceTimersByTime(DRAWER_SLIDE_MS);
    expect(s.getState().ui.drawers.search).toMatchObject({ backdrop: false, open: false });
  });

  it("a quick close → open leaves it open (backdrop not hidden late)", () => {
    const s = store();
    s.dispatch(openDrawer("filters"));
    vi.advanceTimersByTime(DRAWER_SLIDE_MS);
    s.dispatch(closeDrawer("filters"));
    s.dispatch(openDrawer("filters"));
    vi.advanceTimersByTime(DRAWER_SLIDE_MS * 2);
    expect(s.getState().ui.drawers.filters).toMatchObject({ backdrop: true, open: true });
  });

  it("keeps the dropdowns, view and search text", () => {
    const s = store();
    s.dispatch(uiActions.cartMenuShown());
    s.dispatch(uiActions.userMenuShown());
    s.dispatch(uiActions.userMenuHidden());
    s.dispatch(uiActions.productsViewChosen("list"));
    s.dispatch(uiActions.searchQueryChanged("kettle"));
    expect(s.getState().ui).toMatchObject({ cartMenu: true, userMenu: false, productsView: "list", searchQuery: "kettle" });
  });
});
