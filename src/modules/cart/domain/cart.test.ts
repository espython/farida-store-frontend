import { describe, expect, it } from "vitest";
import { Money } from "@/shared/kernel/Money";
import {
  addLine,
  cartTotals,
  clampQuantity,
  emptyCart,
  lineLimit,
  MAX_CART_LINES,
  MAX_LINE_QUANTITY,
  removeLine,
  setLineQuantity,
  type ProductRef,
} from "./cart";

const product = (id: string, price: number, extra: Partial<ProductRef> = {}): ProductRef => ({
  id,
  slug: `p-${id}`,
  title: `Product ${id}`,
  image: null,
  unitPrice: Money.of(price),
  regularUnitPrice: null,
  maxQuantity: null,
  ...extra,
});

const kettle = product("1", 349_000);
const pan = product("2", 120_050, { regularUnitPrice: Money.of(150_000) });

describe("cart lines", () => {
  it("adds a new line and merges repeat adds into it", () => {
    let cart = addLine(emptyCart(), kettle);
    cart = addLine(cart, pan, 2);
    cart = addLine(cart, kettle, 3);
    expect(cart.lines.map((l) => [l.product.id, l.quantity])).toEqual([
      ["1", 4],
      ["2", 2],
    ]);
  });

  it("refreshes the price snapshot when the same product is added again", () => {
    const cheaper = { ...kettle, unitPrice: Money.of(300_000) };
    const cart = addLine(addLine(emptyCart(), kettle), cheaper);
    expect(cart.lines[0].product.unitPrice.amount).toBe(300_000);
  });

  it("caps quantity at the stock remainder and the hard limit", () => {
    const low = product("3", 1000, { maxQuantity: 2 });
    expect(addLine(addLine(emptyCart(), low, 2), low, 5).lines[0].quantity).toBe(2);
    expect(addLine(emptyCart(), kettle, 500).lines[0].quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("ignores products that cannot be bought and a full cart", () => {
    const soldOut = product("4", 1000, { maxQuantity: 0 });
    expect(addLine(emptyCart(), soldOut).lines).toHaveLength(0);

    let full = emptyCart();
    for (let i = 0; i < MAX_CART_LINES; i++) full = addLine(full, product(`x${i}`, 100));
    expect(addLine(full, kettle).lines).toHaveLength(MAX_CART_LINES);
    // Existing lines can still grow.
    expect(addLine(full, product("x0", 100)).lines[0].quantity).toBe(2);
  });

  it("sets, clamps and removes by quantity", () => {
    const cart = addLine(addLine(emptyCart(), kettle), pan);
    expect(setLineQuantity(cart, "1", 3).lines[0].quantity).toBe(3);
    expect(setLineQuantity(cart, "1", 2.7).lines[0].quantity).toBe(2);
    expect(setLineQuantity(cart, "1", 999).lines[0].quantity).toBe(MAX_LINE_QUANTITY);
    expect(setLineQuantity(cart, "1", 0).lines.map((l) => l.product.id)).toEqual(["2"]);
    expect(setLineQuantity(cart, "1", NaN).lines.map((l) => l.product.id)).toEqual(["2"]);
    expect(setLineQuantity(cart, "nope", 3)).toBe(cart);
    expect(removeLine(cart, "2").lines.map((l) => l.product.id)).toEqual(["1"]);
  });

  it("cleans up odd quantities", () => {
    expect(clampQuantity(NaN, kettle)).toBe(1);
    expect(clampQuantity(-4, kettle)).toBe(1);
    expect(lineLimit(product("5", 1, { maxQuantity: 3.9 }))).toBe(3);
    expect(lineLimit(product("6", 1, { maxQuantity: -1 }))).toBe(0);
  });
});

describe("cart totals", () => {
  it("is zero for an empty cart", () => {
    expect(cartTotals(emptyCart())).toEqual({ itemCount: 0, subtotal: Money.zero(), savings: Money.zero() });
  });

  it("sums quantities, subtotal and sale savings in minor units", () => {
    const cart = addLine(addLine(emptyCart(), kettle, 2), pan, 3);
    const totals = cartTotals(cart);
    expect(totals.itemCount).toBe(5);
    expect(totals.subtotal.amount).toBe(2 * 349_000 + 3 * 120_050); // 1,058,150
    expect(totals.savings.amount).toBe(3 * (150_000 - 120_050));
    expect(Money.toDisplay(totals.subtotal)).toBe("10,581.50");
  });

  it("counts no saving when the regular price is not above the sale price", () => {
    const odd = product("7", 5000, { regularUnitPrice: Money.of(4000) });
    expect(cartTotals(addLine(emptyCart(), odd)).savings.amount).toBe(0);
  });
});
