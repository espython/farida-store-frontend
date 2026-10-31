import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import en from "../../../../messages/en.json";
import { Money } from "@/shared/kernel/Money";
import { makeStore } from "@/store";
import { cartActions } from "../application/cartSlice";
import type { ProductRef } from "../domain/cart";
import AddToCartButton from "./AddToCartButton";
import CartLineItem from "./CartLineItem";
import CartSummary from "./CartSummary";
import { cartTotals } from "../domain/cart";

const ref = (id: string, extra: Partial<ProductRef> = {}): ProductRef => ({
  id,
  slug: `p-${id}`,
  title: `Kettle ${id}`,
  image: null,
  unitPrice: Money.of(80_000),
  regularUnitPrice: null,
  maxQuantity: null,
  ...extra,
});

let store = makeStore();
const wrap = (ui: ReactNode) =>
  render(
    <Provider store={store}>
      <NextIntlClientProvider locale="en" messages={en}>
        {ui}
      </NextIntlClientProvider>
    </Provider>
  );
const lines = () => store.getState().cart.cart.lines.map((l) => [l.product.id, l.quantity]);

beforeEach(() => {
  store = makeStore();
  localStorage.clear();
});

describe("AddToCartButton", () => {
  it("waits for the stored cart, then adds one per click and shows the count", () => {
    wrap(<AddToCartButton product={ref("1")} />);
    const button = screen.getByRole("button", { name: "Add Kettle 1 to cart" });
    expect(button).toBeDisabled();
    act(() => {
      store.dispatch(cartActions.cartHydrated({ lines: [] }));
    });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(lines()).toEqual([["1", 2]]);
    expect(screen.getByText("2 in your cart")).toBeInTheDocument();
  });

  it("is disabled for sold-out products and at the stock limit", () => {
    act(() => {
      store.dispatch(cartActions.cartHydrated({ lines: [] }));
    });
    wrap(
      <>
        <AddToCartButton product={ref("2", { maxQuantity: 0 })} />
        <AddToCartButton product={ref("3", { maxQuantity: 1 })} />
      </>
    );
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
    const low = screen.getByRole("button", { name: "Add Kettle 3 to cart" });
    fireEvent.click(low);
    expect(low).toBeDisabled();
    expect(lines()).toEqual([["3", 1]]);
  });

  it("full variant adds the chosen quantity, capped by what is left", () => {
    act(() => {
      store.dispatch(cartActions.cartHydrated({ lines: [] }));
    });
    wrap(<AddToCartButton product={ref("4", { maxQuantity: 3 })} variant="full" />);
    const more = screen.getByRole("button", { name: "Increase quantity" });
    fireEvent.click(more);
    fireEvent.click(more);
    expect(more).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(lines()).toEqual([["4", 3]]);
    expect(screen.getByRole("button", { name: "Limit reached" })).toBeDisabled();
  });
});

describe("CartLineItem and CartSummary", () => {
  it("changes quantity, removes the line and shows totals", () => {
    act(() => {
      store.dispatch(cartActions.cartHydrated({ lines: [] }));
      store.dispatch(cartActions.itemAdded({ product: ref("5", { regularUnitPrice: Money.of(100_000) }), quantity: 2 }));
    });
    const line = store.getState().cart.cart.lines[0];
    const view = wrap(
      <>
        <CartLineItem line={line} />
        <CartSummary totals={cartTotals(store.getState().cart.cart)} />
      </>
    );
    expect(screen.getByRole("link", { name: "Kettle 5" })).toHaveAttribute("href", expect.stringContaining("/product/p-5"));
    expect(screen.getByText("Subtotal (2 items)")).toBeInTheDocument();
    expect(screen.getByText("You save")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(lines()).toEqual([["5", 3]]);
    fireEvent.click(screen.getByRole("button", { name: "Remove Kettle 5" }));
    expect(lines()).toEqual([]);
    view.unmount();
  });
});
