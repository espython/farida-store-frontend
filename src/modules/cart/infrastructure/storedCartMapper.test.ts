import { afterEach, describe, expect, it, vi } from "vitest";
import { Money } from "@/shared/kernel/Money";
import { addLine, emptyCart, MAX_CART_LINES, MAX_LINE_QUANTITY, type ProductRef } from "../domain/cart";
import { toCart, toStoredCart } from "./storedCartMapper";
import { CART_STORAGE_KEY, loadCart, saveCart } from "./cartStorage";

const ref = (id: string, extra: Partial<ProductRef> = {}): ProductRef => ({
  id,
  slug: `p-${id}`,
  title: `Product ${id}`,
  image: null,
  unitPrice: Money.of(10_000),
  regularUnitPrice: null,
  maxQuantity: null,
  ...extra,
});
const stored = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  slug: `p-${id}`,
  title: `Product ${id}`,
  image: null,
  price: 10_000,
  regularPrice: null,
  maxQty: null,
  qty: 1,
  ...extra,
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("stored cart mapper", () => {
  it("round-trips a cart through the stored shape", () => {
    const cart = addLine(
      addLine(emptyCart(), ref("1"), 2),
      ref("2", { regularUnitPrice: Money.of(12_000), maxQuantity: 3, image: "https://x/t.jpg" })
    );
    expect(toCart(JSON.parse(JSON.stringify(toStoredCart(cart))))).toEqual(cart);
  });

  it("stores its own compact shape, not the domain objects", () => {
    expect(toStoredCart(addLine(emptyCart(), ref("1"), 2))).toEqual({ v: 1, lines: [stored("1", { qty: 2 })] });
  });

  it("returns an empty cart for missing, foreign or unversioned data", () => {
    for (const data of [null, "cart", [], { lines: [stored("1")] }, { v: 2, lines: [stored("1")] }, { v: 1, lines: "x" }]) {
      expect(toCart(data)).toEqual(emptyCart());
    }
  });

  it("drops malformed lines and keeps the good ones", () => {
    const cart = toCart({
      v: 1,
      lines: [
        stored("1"),
        stored(""),
        stored("3", { price: 1.5 }),
        stored("4", { price: -100 }),
        stored("5", { price: "100" }),
        stored("6", { maxQty: 0 }),
        null,
        "line",
      ],
    });
    expect(cart.lines.map((l) => l.product.id)).toEqual(["1"]);
  });

  it("applies the domain quantity rules and de-duplicates", () => {
    const cart = toCart({ v: 1, lines: [stored("1", { qty: 999 }), stored("1", { qty: 3 }), stored("2", { qty: -2 }), stored("3", { qty: "2" })] });
    expect(cart.lines.map((l) => [l.product.id, l.quantity])).toEqual([
      ["1", MAX_LINE_QUANTITY],
      ["2", 1],
      ["3", 1],
    ]);
  });

  it("caps the number of lines", () => {
    const lines = Array.from({ length: MAX_CART_LINES + 5 }, (_, i) => stored(String(i)));
    expect(toCart({ v: 1, lines }).lines).toHaveLength(MAX_CART_LINES);
  });
});

describe("cart storage", () => {
  it("saves under the versioned key and removes it when the cart is empty", () => {
    saveCart(addLine(emptyCart(), ref("1")));
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!)).toMatchObject({ v: 1, lines: [{ id: "1" }] });
    expect(loadCart().lines).toHaveLength(1);
    saveCart(emptyCart());
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it("ignores broken JSON and leaves the legacy MobX cart alone", () => {
    localStorage.setItem(CART_STORAGE_KEY, "{");
    expect(loadCart()).toEqual(emptyCart());
    sessionStorage.setItem("cart", "[1,2,3]");
    saveCart(addLine(emptyCart(), ref("1")));
    expect(sessionStorage.getItem("cart")).toBe("[1,2,3]");
  });

  it("survives storage that throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(() => saveCart(addLine(emptyCart(), ref("1")))).not.toThrow();
    expect(loadCart()).toEqual(emptyCart());
  });
});
