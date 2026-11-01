import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import en from "../../../../messages/en.json";
import { Money } from "@/shared/kernel/Money";
import { makeStore } from "@/store";
import type { Product } from "@/modules/catalog";
import { MAX_WISHLIST } from "../domain/Wishlist";
import { wishlistActions } from "../application/wishlistSlice";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("react-toastify", () => ({ toast }));
vi.mock("@/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const products = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/modules/catalog", async (orig) => ({ ...(await orig<object>()), useGetProductsQuery: products.query }));

import WishlistButton from "./WishlistButton";
import WishlistView from "./WishlistView";

const product = (id: string, title: string): Product => ({
  id, slug: `p-${id}`, title, shortDescription: "", description: "", sku: "", price: Money.of(80_000), regularPrice: null,
  stock: { status: "in_stock", quantity: null }, images: [], categories: [], attributes: [], rating: { average: 0, count: 0 }, locale: "en",
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
const hydrate = (ids: string[]) =>
  act(() => {
    store.dispatch(wishlistActions.wishlistHydrated({ productIds: ids }));
  });
const saved = () => store.getState().wishlist.wishlist.productIds;

beforeEach(() => {
  store = makeStore();
  localStorage.clear();
  toast.success.mockReset();
  toast.error.mockReset();
  products.query.mockReset();
});

describe("WishlistButton (guest)", () => {
  it("waits for the stored list, then saves and unsaves", async () => {
    wrap(<WishlistButton productId="7" title="Kettle" />);
    const button = screen.getByRole("button", { name: "Save Kettle to your wishlist" });
    expect(button).toBeDisabled();
    hydrate([]);
    await act(async () => fireEvent.click(button));
    expect(saved()).toEqual(["7"]);
    expect(screen.getByRole("button", { name: "Remove Kettle from your wishlist" })).toHaveAttribute("aria-pressed", "true");
    expect(toast.success).toHaveBeenCalledWith("Saved Kettle to your wishlist", expect.anything());
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Remove Kettle/ })));
    expect(saved()).toEqual([]);
  });

  it("says so when the list is full", async () => {
    wrap(<WishlistButton productId="999" title="Pan" variant="full" />);
    hydrate(Array.from({ length: MAX_WISHLIST }, (_, i) => String(i + 1)));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save Pan to your wishlist" })));
    expect(saved()).toHaveLength(MAX_WISHLIST);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("wishlist is full"), expect.anything());
  });
});

describe("WishlistView", () => {
  it("shows the saved products from the catalog, newest first, with the page's actions", () => {
    products.query.mockReturnValue({ data: { items: [product("9", "Pan"), product("7", "Kettle")] }, isLoading: false, isError: false });
    wrap(<WishlistView renderActions={(p) => <button type="button">Add {p.title}</button>} />);
    hydrate(["9", "7", "404"]);
    expect(products.query).toHaveBeenLastCalledWith({ locale: "en", ids: "9,7,404" }, { skip: false });
    const cards = screen.getAllByTestId("catalog-product-card");
    expect(cards.map((c) => c.querySelector("h3")?.textContent)).toEqual(["Pan", "Kettle"]);
    expect(screen.getByText("2 products")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Pan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Pan from your wishlist" })).toBeInTheDocument();
    // A guest is told the list stays on this device.
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("shows the empty state without asking the catalog", () => {
    products.query.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    wrap(<WishlistView />);
    hydrate([]);
    expect(screen.getByText("Your wishlist is empty")).toBeInTheDocument();
    expect(products.query).toHaveBeenLastCalledWith(expect.anything(), { skip: true });
  });

  it("offers a retry when the catalog cannot be reached", () => {
    const refetch = vi.fn();
    products.query.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    wrap(<WishlistView />);
    hydrate(["7"]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });
});
