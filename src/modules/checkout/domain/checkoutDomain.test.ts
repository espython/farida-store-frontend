import { describe, expect, it } from "vitest";
import { Money } from "@/shared/kernel/Money";
import { cleanAddress, emptyAddress, isAddressComplete, normalisePhone, validateAddress, type Address } from "./Address";
import { canPlaceOrder, selectedRate, type Checkout } from "./Checkout";
import { governorateName, GOVERNORATES, isGovernorate } from "./governorates";
import { fingerprintOf, isIdempotencyKey, keyFor } from "./idempotency";

const good: Address = {
  firstName: "Mona",
  lastName: "Ali",
  address1: "12 El Nasr St",
  address2: "",
  city: "Nasr City",
  state: "EGC",
  postcode: "11765",
  phone: "01001234567",
};

describe("Address", () => {
  it("accepts a complete Egyptian address", () => {
    expect(validateAddress(good)).toEqual({});
    expect(isAddressComplete(good)).toBe(true);
  });

  it("names every problem by field", () => {
    expect(validateAddress({ ...emptyAddress(), address2: "x".repeat(101) }).postcode).toBe("required");
    expect(validateAddress({ ...emptyAddress(), address2: "x".repeat(101), postcode: "12" })).toEqual({
      firstName: "required",
      lastName: "required",
      address1: "required",
      address2: "too_long",
      city: "required",
      state: "governorate_invalid",
      phone: "phone_invalid",
      postcode: "postcode_invalid",
    });
  });

  it("normalises Egyptian mobile numbers and rejects landlines", () => {
    expect(normalisePhone("+20 100 123 4567")).toBe("01001234567");
    expect(normalisePhone("0020-115-123-4567")).toBe("01151234567");
    for (const bad of ["0223456789", "01301234567", "0100123456", "abc"]) {
      expect(validateAddress({ ...good, phone: bad }).phone).toBe("phone_invalid");
    }
    expect(cleanAddress({ ...good, firstName: "  Mona ", phone: "+201001234567" })).toMatchObject({ firstName: "Mona", phone: "01001234567" });
  });

  it("knows all 27 governorates in both languages", () => {
    expect(GOVERNORATES).toHaveLength(27);
    expect(isGovernorate("EGGZ")).toBe(true);
    expect(isGovernorate("XX")).toBe(false);
    expect(governorateName("EGALX", "ar")).toBe("الإسكندرية");
    expect(governorateName("EGALX", "en")).toBe("Alexandria");
  });
});

describe("idempotency", () => {
  const intent = { customerId: "7", items: [{ id: "1", quantity: 2 }, { id: "3", quantity: 1 }], addressKey: "EGC|12 El Nasr", paymentMethod: "cod" };
  const random = () => "r1";

  it("reuses the stored key for the same intent, in any item order", () => {
    const first = keyFor(intent, null, random);
    expect(first.key).toBe("7_r1");
    const again = keyFor({ ...intent, items: [...intent.items].reverse() }, first, () => "r2");
    expect(again).toBe(first);
  });

  it("mints a new key when what is bought changes", () => {
    const first = keyFor(intent, null, random);
    for (const changed of [
      { ...intent, items: [{ id: "1", quantity: 3 }] },
      { ...intent, paymentMethod: "card" },
      { ...intent, addressKey: "EGGZ|other" },
    ]) {
      expect(keyFor(changed, first, () => "r9").key).toBe("7_r9");
    }
    expect(fingerprintOf(intent)).toContain("1:2,3:1");
  });

  it("accepts only bounded, URL-safe keys from clients", () => {
    expect(isIdempotencyKey("7_3f2b9c1a-7e6d-4b8a")).toBe(true);
    for (const bad of ["short", "has space here", "x".repeat(121), 42, null]) expect(isIdempotencyKey(bad)).toBe(false);
  });
});

describe("Checkout", () => {
  const checkout = (over: Partial<Checkout> = {}): Checkout => ({
    lines: [{ product: { id: "1", slug: "k", title: "K", image: null, unitPrice: Money.of(100), regularUnitPrice: null, maxQuantity: null }, quantity: 1 }],
    address: good,
    shippingRates: [{ id: "flat_rate:1", name: "Flat", price: Money.of(5000), selected: true }],
    coupons: [],
    paymentMethods: ["cod"],
    totals: { items: Money.of(100), shipping: Money.of(5000), discount: Money.zero(), total: Money.of(5100) },
    ...over,
  });

  it("can be placed with items, an address, a chosen rate and a payment method", () => {
    expect(selectedRate(checkout())?.id).toBe("flat_rate:1");
    expect(canPlaceOrder(checkout(), true)).toBe(true);
    expect(canPlaceOrder(checkout(), false)).toBe(false);
    expect(canPlaceOrder(checkout({ lines: [] }), true)).toBe(false);
    expect(canPlaceOrder(checkout({ shippingRates: [] }), true)).toBe(false);
    expect(canPlaceOrder(checkout({ paymentMethods: [] }), true)).toBe(false);
  });
});
