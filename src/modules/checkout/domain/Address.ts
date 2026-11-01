import { isGovernorate } from "./governorates";

/** Delivery address. Egypt only (the shop ships nowhere else). */
export interface Address {
  firstName: string;
  lastName: string;
  /** Street, building. */
  address1: string;
  /** Apartment, floor, landmark. */
  address2: string;
  /** City or district. */
  city: string;
  /** Governorate code, e.g. "EGC". */
  state: string;
  postcode: string;
  phone: string;
}

export const emptyAddress = (): Address => ({
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  postcode: "",
  phone: "",
});

export type AddressError = "required" | "too_long" | "governorate_invalid" | "phone_invalid" | "postcode_invalid";

const MAX = 100;
// Egyptian mobile numbers: 01 + operator digit (0, 1, 2, 5) + 8 digits.
// Spaces, dashes and a +20 / 0020 prefix are tolerated and normalised.
const MOBILE = /^01[0125]\d{8}$/;

/** "+20 100 123 4567" → "01001234567"; anything else is returned trimmed. */
export const normalisePhone = (raw: string): string => {
  const digits = raw.replace(/[\s-]/g, "").replace(/^(\+20|0020)/, "0");
  return MOBILE.test(digits) ? digits : raw.trim();
};

/** One code per invalid field; empty when the address can be used. */
export const validateAddress = (a: Address): Partial<Record<keyof Address, AddressError>> => {
  const errors: Partial<Record<keyof Address, AddressError>> = {};
  for (const field of ["firstName", "lastName", "address1", "city"] as const) {
    const v = a[field].trim();
    if (!v) errors[field] = "required";
    else if (v.length > MAX) errors[field] = "too_long";
  }
  if (a.address2.trim().length > MAX) errors.address2 = "too_long";
  if (!isGovernorate(a.state)) errors.state = "governorate_invalid";
  if (!MOBILE.test(normalisePhone(a.phone))) errors.phone = "phone_invalid";
  // WooCommerce requires a postcode for Egypt (spike-checkout.mjs); relax
  // this together with the shop setting if the owner turns it off (W2).
  const postcode = a.postcode.trim();
  if (!postcode) errors.postcode = "required";
  else if (!/^\d{5}$/.test(postcode)) errors.postcode = "postcode_invalid";
  return errors;
};

/** Trimmed, phone normalised; call after validateAddress passed. */
export const cleanAddress = (a: Address): Address => ({
  firstName: a.firstName.trim(),
  lastName: a.lastName.trim(),
  address1: a.address1.trim(),
  address2: a.address2.trim(),
  city: a.city.trim(),
  state: a.state,
  postcode: a.postcode.trim(),
  phone: normalisePhone(a.phone),
});

/** Enough to place an order (the shop's saved address may be partial). */
export const isAddressComplete = (a: Address): boolean => Object.keys(validateAddress(a)).length === 0;
