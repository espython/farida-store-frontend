import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { Money } from "@/shared/kernel/Money";
import { makeStore } from "@/store";
import { addLine, emptyCart, type ProductRef } from "../domain/cart";
import { cartActions } from "./cartSlice";

const ref = (id: string): ProductRef => ({
  id,
  slug: `p-${id}`,
  title: `Item ${id}`,
  image: null,
  unitPrice: Money.of(1000),
  regularUnitPrice: null,
  maxQuantity: null,
});

const state = vi.hoisted(() => ({ status: "signedIn" as string }));
const merge = vi.hoisted(() => vi.fn());
vi.mock("@/modules/customer", async (orig) => ({
  ...(await orig<typeof import("@/modules/customer")>()),
  useSession: () => ({ status: state.status, session: null }),
}));
vi.mock("./cartApi", () => ({ cartApi: { useMergeGuestCartMutation: () => [merge] } }));

import { useGuestCartMerge } from "./useGuestCartMerge";

const setup = (ids: string[]) => {
  const store = makeStore();
  let cart = emptyCart();
  for (const id of ids) cart = addLine(cart, ref(id), 2);
  store.dispatch(cartActions.cartHydrated(cart));
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  return { store, ...renderHook(() => useGuestCartMerge(), { wrapper }) };
};

beforeEach(() => {
  state.status = "signedIn";
  merge.mockReset();
});

describe("useGuestCartMerge", () => {
  it("moves the browser cart into the saved cart once, then empties it", async () => {
    merge.mockReturnValue({ unwrap: () => Promise.resolve({ cart: emptyCart(), skipped: ["2"] }) });
    const { store, result, rerender } = setup(["1", "2"]);
    await waitFor(() => expect(result.current).toEqual({ status: "merged", count: 1, skipped: 1 }));
    expect(merge).toHaveBeenCalledTimes(1);
    expect(merge).toHaveBeenCalledWith({
      lines: [
        { productId: "1", quantity: 2 },
        { productId: "2", quantity: 2 },
      ],
    });
    expect(store.getState().cart.cart.lines).toEqual([]);
    rerender();
    expect(merge).toHaveBeenCalledTimes(1);
  });

  it("keeps the browser cart when the merge fails", async () => {
    merge.mockReturnValue({ unwrap: () => Promise.reject(new Error("down")) });
    const { store, result } = setup(["1"]);
    await waitFor(() => expect(result.current).toEqual({ status: "failed" }));
    expect(store.getState().cart.cart.lines).toHaveLength(1);
  });

  it("does nothing for guests or an empty browser cart", async () => {
    state.status = "signedOut";
    setup(["1"]);
    state.status = "signedIn";
    setup([]);
    await act(async () => {});
    expect(merge).not.toHaveBeenCalled();
  });
});
