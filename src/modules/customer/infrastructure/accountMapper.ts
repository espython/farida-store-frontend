import { emptyAddress, isAddressComplete, type Address } from "@/shared/kernel/Address";
import { isEntryId, MAX_ADDRESSES, type AddressBook, type BookEntry } from "../domain/AddressBook";
import type { Profile } from "../domain/Profile";
import type { WcCustomerAccount, WcCustomerAddress, WcMeta } from "./wcCustomerDto";

/** Customer meta key holding the address book (JSON, versioned). Not exposed by any public WP route (spike-account). */
export const BOOK_META_KEY = "farida_address_book";
/** Id of the entry made from an address the customer had before the book existed. */
export const SEEDED_ENTRY_ID = "primary";

export const toProfile = (dto: WcCustomerAccount): Profile => ({
  firstName: dto.first_name ?? "",
  lastName: dto.last_name ?? "",
  email: dto.email ?? "",
});

const str = (v: unknown) => (typeof v === "string" ? v : "");

const fromWcAddress = (a: Partial<WcCustomerAddress>): Address => ({
  firstName: str(a.first_name),
  lastName: str(a.last_name),
  address1: str(a.address_1),
  address2: str(a.address_2),
  city: str(a.city),
  state: str(a.state),
  postcode: str(a.postcode),
  phone: str(a.phone),
});

/**
 * The customer's delivery address: shipping, with billing's phone when
 * shipping has none (as checkout reads it). Null when nothing is saved.
 */
export const toDefaultAddress = (dto: WcCustomerAccount): Address | null => {
  const shipping = fromWcAddress(dto.shipping ?? {});
  if (!shipping.address1) return null;
  return shipping.phone ? shipping : { ...shipping, phone: str(dto.billing?.phone) };
};

const toEntry = (raw: unknown): BookEntry | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !isEntryId(r.id)) return null;
  const a = (r.address ?? {}) as Record<string, unknown>;
  const address = { ...emptyAddress() };
  for (const k of Object.keys(address) as (keyof Address)[]) address[k] = str(a[k]);
  return address.address1 ? { id: r.id, address } : null;
};

/**
 * The stored book. Malformed entries are dropped rather than failing the page.
 * No book yet: the customer's saved delivery address (from an earlier
 * checkout) becomes its first entry, so nothing they had disappears.
 */
export const toAddressBook = (dto: WcCustomerAccount): AddressBook => {
  const meta = (dto.meta_data ?? []).find((m) => m.key === BOOK_META_KEY);
  if (!meta) {
    const current = toDefaultAddress(dto);
    return { entries: current && isAddressComplete(current) ? [{ id: SEEDED_ENTRY_ID, address: current }] : [] };
  }
  let parsed: unknown;
  try {
    parsed = typeof meta.value === "string" ? JSON.parse(meta.value) : meta.value;
  } catch {
    parsed = null;
  }
  const raw = (parsed as { entries?: unknown } | null)?.entries;
  const entries = (Array.isArray(raw) ? raw : []).map(toEntry).filter((e): e is BookEntry => e !== null);
  const unique = entries.filter((e, i) => entries.findIndex((x) => x.id === e.id) === i);
  return { entries: unique.slice(0, MAX_ADDRESSES) };
};

export const toBookMeta = (book: AddressBook): WcMeta => ({
  key: BOOK_META_KEY,
  value: JSON.stringify({ v: 1, entries: book.entries }),
});

/** Woo address fields for a new delivery address; null clears it (billing keeps its email). */
export const toWcAddress = (a: Address | null): Omit<WcCustomerAddress, "email"> => ({
  first_name: a?.firstName ?? "",
  last_name: a?.lastName ?? "",
  company: "",
  address_1: a?.address1 ?? "",
  address_2: a?.address2 ?? "",
  city: a?.city ?? "",
  state: a?.state ?? "",
  postcode: a?.postcode ?? "",
  country: a ? "EG" : "",
  phone: a?.phone ?? "",
});
