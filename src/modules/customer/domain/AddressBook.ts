import type { Address } from "@/shared/kernel/Address";

/**
 * The customer's saved delivery addresses.
 *
 * The default address is not stored in the book: it is the customer's own
 * delivery address on the shop (what checkout starts from). An entry is the
 * default when it equals that address, so the book and checkout never
 * disagree; after a checkout to a new address, no entry is the default.
 */
export interface BookEntry {
  id: string;
  address: Address;
}

export interface AddressBook {
  entries: BookEntry[];
}

export interface SavedAddress extends BookEntry {
  isDefault: boolean;
}

export const MAX_ADDRESSES = 10;

/** The book as the account pages see it. */
export interface AddressBookView {
  addresses: SavedAddress[];
  limit: number;
}

/** Entry ids are made by the server; anything else in a URL is refused before lookup. */
export const isEntryId = (id: string) => /^[a-z0-9]{6,32}$/.test(id);

export type AddressBookError = "not_found" | "book_full";

/**
 * The book after a change. `newDefault` is the customer's new delivery
 * address: an address to save, null to clear it, or absent to leave it alone.
 */
export type BookChange =
  | { ok: true; book: AddressBook; newDefault?: Address | null }
  | { ok: false; error: AddressBookError };

const FIELDS: (keyof Address)[] = ["firstName", "lastName", "address1", "address2", "city", "state", "postcode", "phone"];

export const sameAddress = (a: Address, b: Address) => FIELDS.every((f) => a[f].trim() === b[f].trim());

export const defaultIdOf = (book: AddressBook, current: Address | null): string | null =>
  (current && book.entries.find((e) => sameAddress(e.address, current))?.id) ?? null;

export const toSavedAddresses = (book: AddressBook, current: Address | null): SavedAddress[] => {
  const defaultId = defaultIdOf(book, current);
  return book.entries.map((e) => ({ ...e, isDefault: e.id === defaultId }));
};

/** Add an address; the first one, or one marked so, becomes the default. */
export const addEntry = (book: AddressBook, current: Address | null, entry: BookEntry, makeDefault: boolean): BookChange => {
  if (book.entries.length >= MAX_ADDRESSES) return { ok: false, error: "book_full" };
  const next = { entries: [...book.entries, entry] };
  return makeDefault || defaultIdOf(book, current) === null ? { ok: true, book: next, newDefault: entry.address } : { ok: true, book: next };
};

/** Edit an address; editing the default edits the delivery address too. */
export const updateEntry = (book: AddressBook, current: Address | null, id: string, address: Address, makeDefault: boolean): BookChange => {
  if (!book.entries.some((e) => e.id === id)) return { ok: false, error: "not_found" };
  const next = { entries: book.entries.map((e) => (e.id === id ? { id, address } : e)) };
  return makeDefault || defaultIdOf(book, current) === id ? { ok: true, book: next, newDefault: address } : { ok: true, book: next };
};

/** Remove an address; if it was the default, the next one takes over (or none is left). */
export const removeEntry = (book: AddressBook, current: Address | null, id: string): BookChange => {
  if (!book.entries.some((e) => e.id === id)) return { ok: false, error: "not_found" };
  const next = { entries: book.entries.filter((e) => e.id !== id) };
  if (defaultIdOf(book, current) !== id) return { ok: true, book: next };
  return { ok: true, book: next, newDefault: next.entries[0]?.address ?? null };
};

export const makeDefault = (book: AddressBook, id: string): BookChange => {
  const entry = book.entries.find((e) => e.id === id);
  return entry ? { ok: true, book, newDefault: entry.address } : { ok: false, error: "not_found" };
};
