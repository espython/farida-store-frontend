import { AppError } from "@/shared/kernel/AppError";
import { Money } from "@/shared/kernel/Money";
import type { CartLine } from "@/modules/cart";
import { emptyAddress, type Address } from "../domain/Address";
import type { Checkout, PaymentMethod, PlacedOrder } from "../domain/Checkout";
import type { StoreAddress, StoreCheckoutCart, WooOrder } from "./storeCheckoutDto";

const minor = (value: string | null | undefined, unit: number): Money => {
  if (unit !== 2) throw new AppError("invalid_money", "Unsupported currency precision", 502);
  return Money.fromMinorUnits(value || "0");
};

export const toAddress = (a: Partial<StoreAddress> | undefined): Address =>
  a
    ? {
        firstName: a.first_name ?? "",
        lastName: a.last_name ?? "",
        address1: a.address_1 ?? "",
        address2: a.address_2 ?? "",
        city: a.city ?? "",
        state: a.state ?? "",
        postcode: a.postcode ?? "",
        phone: a.phone ?? "",
      }
    : emptyAddress();

export const toStoreAddress = (a: Address): StoreAddress => ({
  first_name: a.firstName,
  last_name: a.lastName,
  address_1: a.address1,
  address_2: a.address2,
  city: a.city,
  state: a.state,
  postcode: a.postcode,
  country: "EG",
  phone: a.phone,
});

// Woo gateway ids → our payment methods. Paymob registers under its own id;
// unknown gateways are not offered rather than shown with a raw id.
const PAYMENT_METHODS: Record<string, PaymentMethod> = { cod: "cod", paymob: "card", "paymob-main": "card" };

/** Store API cart → Checkout. Lines come from the cart module's mapper, which owns that shape. */
export const toCheckout = (dto: StoreCheckoutCart, lines: CartLine[]): Checkout => {
  const unit = dto.totals.currency_minor_unit;
  if (dto.totals.currency_code !== "EGP") throw new AppError("invalid_money", "Unsupported currency", 502);
  // Prefer the shipping address; fall back to billing (Woo copies one into the other).
  const shipping = toAddress(dto.shipping_address);
  const address = shipping.address1 ? shipping : { ...toAddress(dto.billing_address), phone: dto.billing_address?.phone ?? "" };
  if (!address.phone) address.phone = dto.billing_address?.phone ?? "";
  return {
    lines,
    address,
    shippingRates: (dto.shipping_rates ?? []).flatMap((pkg) =>
      pkg.shipping_rates.map((r) => ({ id: r.rate_id, name: r.name, price: minor(r.price, r.currency_minor_unit), selected: r.selected }))
    ),
    coupons: (dto.coupons ?? []).map((c) => ({ code: c.code, discount: minor(c.totals.total_discount, c.totals.currency_minor_unit) })),
    paymentMethods: (dto.payment_methods ?? [])
      .map((m) => PAYMENT_METHODS[m])
      .filter((m, i, all): m is PaymentMethod => Boolean(m) && all.indexOf(m) === i),
    totals: {
      items: minor(dto.totals.total_items, unit),
      shipping: minor(dto.totals.total_shipping, unit),
      discount: minor(dto.totals.total_discount, unit),
      total: minor(dto.totals.total_price, unit),
    },
  };
};

/** The shipping package the selected rate belongs to (Woo needs it to switch rates). */
export const packageOfRate = (dto: StoreCheckoutCart, rateId: string): string | number | null =>
  (dto.shipping_rates ?? []).find((p) => p.shipping_rates.some((r) => r.rate_id === rateId))?.package_id ?? null;

/** REST order → PlacedOrder (decimal strings, unlike the Store API). */
export const toPlacedOrder = (o: WooOrder): PlacedOrder => {
  if (o.currency !== "EGP") throw new AppError("invalid_money", "Unsupported currency", 502);
  const dec = (v: string) => Money.fromDecimal(v || "0");
  const shipping = toAddress(o.shipping);
  return {
    id: String(o.id),
    status: o.status,
    paymentMethod: o.payment_method,
    createdAt: o.date_created,
    lines: o.line_items.map((l) => ({ title: l.name, quantity: l.quantity, total: dec(l.subtotal ?? l.total), image: l.image?.src || null, slug: null })),
    address: { ...shipping, phone: shipping.phone || o.billing?.phone || "" },
    note: o.customer_note ?? "",
    totals: {
      items: Money.subtract(Money.add(dec(o.total), dec(o.discount_total)), dec(o.shipping_total)),
      shipping: dec(o.shipping_total),
      discount: dec(o.discount_total),
      total: dec(o.total),
    },
  };
};
