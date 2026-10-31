import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { Money } from "@/shared/kernel/Money";
import { makeStore } from "@/store";
import type { Cart, ProductRef } from "../domain/cart";

const ref = (id: string): ProductRef => ({
  id,
  slug: `p-${id}`,
  title: `Item ${id}`,
  image: null,
  unitPrice: Money.of(1000),
  regularUnitPrice: null,
  maxQuantity: null,
});
const serverCart: Cart = { lines: [{ product: ref("7"), quantity: 2 }] };

const state = vi.hoisted(() => ({ status: "signedIn" as "signedIn" | "signedOut" | "loading" }));
const calls = vi.hoisted(() => ({ add: vi.fn(), set: vi.fn(), remove: vi.fn(), clear: vi.fn() }));
const ok = () => ({ unwrap: () => Promise.resolve({}) });
const refused = (code: string) => ({ unwrap: () => Promise.reject({ status: 400, data: { error: { code } } }) });

vi.mock("@/modules/customer", async (orig) => ({
  ...(await orig<typeof import("@/modules/customer")>()),
  useSession: () => ({ status: state.status, session: null }),
}));
vi.mock("./cartApi", () => ({
  cartApi: {
    useGetServerCartQuery: (_: unknown, opts: { skip: boolean }) =>
      opts.skip ? { data: undefined, isSuccess: false } : { data: serverCart, isSuccess: true },
    useAddServerItemMutation: () => [calls.add, { isLoading: false }],
    useSetServerQuantityMutation: () => [calls.set, { isLoading: false }],
    useRemoveServerItemMutation: () => [calls.remove, { isLoading: false }],
    useClearServerCartMutation: () => [calls.clear, { isLoading: false }],
  },
}));

import { useCart } from "./useCart";

const wrapper = (store = makeStore()) =>
  function Wrap({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };

beforeEach(() => {
  state.status = "signedIn";
  for (const f of Object.values(calls)) f.mockReset().mockReturnValue(ok());
});

describe("useCart for a signed-in customer", () => {
  it("shows the saved cart and sends changes to the shop, not the browser cart", async () => {
    const store = makeStore();
    const { result } = renderHook(() => useCart(), { wrapper: wrapper(store) });
    expect(result.current).toMatchObject({ source: "server", hydrated: true });
    expect(result.current.totals.itemCount).toBe(2);
    expect(result.current.quantityOf("7")).toBe(2);

    await act(async () => {
      expect(await result.current.add(ref("9"), 3)).toEqual({ ok: true });
    });
    expect(calls.add).toHaveBeenCalledWith({ productId: "9", quantity: 3 });
    expect(store.getState().cart.cart.lines).toEqual([]);

    await act(async () => {
      await result.current.setQuantity("7", 0);
      await result.current.remove("7");
      await result.current.clear();
    });
    expect(calls.set).toHaveBeenCalledWith({ productId: "7", quantity: 0 });
    expect(calls.remove).toHaveBeenCalledWith({ productId: "7" });
    expect(calls.clear).toHaveBeenCalled();
  });

  it("reports the shop's refusal code", async () => {
    calls.add.mockReturnValue(refused("woocommerce_rest_product_partially_out_of_stock"));
    const { result } = renderHook(() => useCart(), { wrapper: wrapper() });
    await act(async () => {
      expect(await result.current.add(ref("9"))).toEqual({ ok: false, code: "woocommerce_rest_product_partially_out_of_stock" });
    });
  });

  it("shows nothing while the session is unknown, and the browser cart when signed out", () => {
    state.status = "loading";
    const { result, rerender } = renderHook(() => useCart(), { wrapper: wrapper() });
    expect(result.current).toMatchObject({ hydrated: false, lines: [] });
    state.status = "signedOut";
    rerender();
    expect(result.current.source).toBe("guest");
  });
});
