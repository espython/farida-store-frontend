import { describe, expect, it } from "vitest";
import { Money } from "@/shared/kernel/Money";
import type { Product } from "@/modules/catalog";
import { addLine, emptyCart, type ProductRef } from "../domain/cart";
import { CART_KEY, cartActions as a, cartReducer as reducer, initialCartState } from "./cartSlice";
import { selectCartCount, selectCartLine, selectCartTotals } from "./selectors";
import { toProductRef } from "./productRef";

const ref = (id: string, price: number): ProductRef => ({
  id,
  slug: `p-${id}`,
  title: `Product ${id}`,
  image: null,
  unitPrice: Money.of(price),
  regularUnitPrice: null,
  maxQuantity: null,
});

const run = (...actions: Parameters<typeof reducer>[1][]) => actions.reduce(reducer, initialCartState);
const ids = (s: typeof initialCartState) => s.cart.lines.map((l) => [l.product.id, l.quantity]);
const root = (state = initialCartState) => ({ [CART_KEY]: state });

describe("cart slice", () => {
  it("applies the domain rules for add, quantity, remove and clear", () => {
    const s = run(
      a.itemAdded({ product: ref("1", 1000) }),
      a.itemAdded({ product: ref("2", 500), quantity: 2 }),
      a.itemAdded({ product: ref("1", 1000) }),
      a.quantityChanged({ productId: "2", quantity: 5 })
    );
    expect(ids(s)).toEqual([
      ["1", 2],
      ["2", 5],
    ]);
    expect(ids(reducer(s, a.itemRemoved({ productId: "1" })))).toEqual([["2", 5]]);
    expect(ids(reducer(s, a.quantityChanged({ productId: "2", quantity: 0 })))).toEqual([["1", 2]]);
    expect(reducer(s, a.cartCleared()).cart).toEqual(emptyCart());
  });

  it("is not hydrated until storage has been read", () => {
    expect(initialCartState.hydrated).toBe(false);
    const s = run(a.cartHydrated(addLine(emptyCart(), ref("9", 100), 3)));
    expect(s.hydrated).toBe(true);
    expect(ids(s)).toEqual([["9", 3]]);
  });
});

describe("cart selectors", () => {
  const s = run(a.itemAdded({ product: ref("1", 1000), quantity: 2 }), a.itemAdded({ product: ref("2", 250) }));

  it("derives totals, count and a single line", () => {
    expect(selectCartTotals(root(s)).subtotal).toEqual(Money.of(2250));
    expect(selectCartCount(root(s))).toBe(3);
    expect(selectCartLine(root(s), "2")?.quantity).toBe(1);
    expect(selectCartLine(root(s), "x")).toBeUndefined();
  });

  it("memoises totals on the cart aggregate", () => {
    expect(selectCartTotals(root(s))).toBe(selectCartTotals(root(s)));
  });
});

describe("toProductRef", () => {
  const product = {
    id: "42",
    slug: "kettle",
    title: "Kettle",
    price: Money.of(80_000),
    regularPrice: Money.of(100_000),
    stock: { status: "in_stock", quantity: null },
    images: [{ id: 1, src: "https://x/full.jpg", thumbnail: "https://x/thumb.jpg", alt: "" }],
  } as unknown as Product;

  it("snapshots price, sale price, thumbnail and stock limit", () => {
    expect(toProductRef(product)).toEqual({
      id: "42",
      slug: "kettle",
      title: "Kettle",
      image: "https://x/thumb.jpg",
      unitPrice: Money.of(80_000),
      regularUnitPrice: Money.of(100_000),
      maxQuantity: null,
    });
    expect(toProductRef({ ...product, stock: { status: "low", quantity: 2 } }).maxQuantity).toBe(2);
    expect(toProductRef({ ...product, stock: { status: "out_of_stock", quantity: null } }).maxQuantity).toBe(0);
    expect(toProductRef({ ...product, images: [] }).image).toBeNull();
  });
});
