import { afterEach, describe, expect, it } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { Money } from "@/shared/kernel/Money";
import { makeStore } from "@/store";
import { CART_STORAGE_KEY } from "../infrastructure/cartStorage";
import { toStoredCart } from "../infrastructure/storedCartMapper";
import { addLine, emptyCart, type ProductRef } from "../domain/cart";
import { CART_KEY } from "./cartSlice";
import { useCartPersistence } from "./cartPersistence";
import { useCart } from "./useCart";

const ref = (id: string): ProductRef => ({
  id,
  slug: `p-${id}`,
  title: `Product ${id}`,
  image: null,
  unitPrice: Money.of(1000),
  regularUnitPrice: null,
  maxQuantity: null,
});
const storedText = (id: string, qty: number) => JSON.stringify(toStoredCart(addLine(emptyCart(), ref(id), qty)));

const Persist = () => {
  useCartPersistence();
  return null;
};

afterEach(() => localStorage.clear());

describe("useCart", () => {
  it("exposes the cart use cases and writes each change to storage", () => {
    const store = makeStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.add(ref("1"), 2));
    act(() => result.current.add(ref("2")));
    expect(result.current.totals).toMatchObject({ itemCount: 3, subtotal: Money.of(3000) });
    expect(result.current.quantityOf("1")).toBe(2);
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!).lines).toHaveLength(2);

    act(() => result.current.setQuantity("1", 5));
    act(() => result.current.remove("2"));
    expect(result.current.lines.map((l) => [l.product.id, l.quantity])).toEqual([["1", 5]]);
    expect(result.current.quantityOf("2")).toBe(0);

    act(() => result.current.clear());
    expect(result.current.lines).toEqual([]);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });
});

describe("cart persistence", () => {
  it("does not read storage while rendering on the server", () => {
    localStorage.setItem(CART_STORAGE_KEY, storedText("1", 1));
    const store = makeStore();
    renderToString(
      <Provider store={store}>
        <Persist />
      </Provider>
    );
    expect(store.getState()[CART_KEY]).toEqual({ cart: emptyCart(), hydrated: false });
  });

  it("hydrates after mount and follows other tabs without writing back", () => {
    localStorage.setItem(CART_STORAGE_KEY, storedText("1", 1));
    const store = makeStore();
    render(
      <Provider store={store}>
        <Persist />
      </Provider>
    );
    expect(store.getState()[CART_KEY]).toMatchObject({ hydrated: true, cart: { lines: [{ product: { id: "1" } }] } });

    const other = storedText("2", 4);
    localStorage.setItem(CART_STORAGE_KEY, other);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: CART_STORAGE_KEY, newValue: other }));
    });
    expect(store.getState()[CART_KEY].cart.lines.map((l) => [l.product.id, l.quantity])).toEqual([["2", 4]]);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBe(other);
  });
});
