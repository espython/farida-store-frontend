import { describe, expect, it } from "vitest";
import type { Address } from "@/shared/kernel/Address";
import { addEntry, makeDefault, MAX_ADDRESSES, removeEntry, toSavedAddresses, updateEntry, type AddressBook } from "./domain/AddressBook";
import { cleanProfile, fullName, validateProfile } from "./domain/Profile";
import { BOOK_META_KEY, SEEDED_ENTRY_ID, toAddressBook, toBookMeta, toDefaultAddress, toWcAddress } from "./infrastructure/accountMapper";
import type { WcCustomerAccount } from "./infrastructure/wcCustomerDto";
import { toAccountFailure } from "./application/accountFailure";

const home: Address = { firstName: "Mona", lastName: "Ali", address1: "5 Tahrir St", address2: "", city: "Dokki", state: "EGGZ", postcode: "12611", phone: "01012345678" };
const work: Address = { ...home, address1: "9 Nile Corniche", city: "Maadi", state: "EGC", postcode: "11728" };
const book = (...entries: [string, Address][]): AddressBook => ({ entries: entries.map(([id, address]) => ({ id, address })) });

describe("Profile", () => {
  it("needs both names, 50 characters at most, and trims them", () => {
    expect(validateProfile({ firstName: " ", lastName: "x".repeat(51) })).toEqual({ firstName: "required", lastName: "too_long" });
    expect(validateProfile({ firstName: "Mona", lastName: "Ali" })).toEqual({});
    expect(cleanProfile({ firstName: " Mona ", lastName: "Ali " })).toEqual({ firstName: "Mona", lastName: "Ali" });
    expect(fullName({ firstName: "Mona", lastName: "" })).toBe("Mona");
  });
});

describe("AddressBook", () => {
  it("marks as default the entry equal to the delivery address, or none", () => {
    const b = book(["aaaaaa", home], ["bbbbbb", work]);
    expect(toSavedAddresses(b, { ...work, city: " Maadi " }).map((e) => e.isDefault)).toEqual([false, true]);
    expect(toSavedAddresses(b, null).some((e) => e.isDefault)).toBe(false);
  });

  it("makes the first address the default, later ones only when asked", () => {
    const first = addEntry(book(), null, { id: "aaaaaa", address: home }, false);
    expect(first).toEqual({ ok: true, book: book(["aaaaaa", home]), newDefault: home });
    const second = addEntry(book(["aaaaaa", home]), home, { id: "bbbbbb", address: work }, false);
    expect(second.ok && second.newDefault).toBeUndefined();
    const asked = addEntry(book(["aaaaaa", home]), home, { id: "bbbbbb", address: work }, true);
    expect(asked.ok && asked.newDefault).toEqual(work);
  });

  it("refuses an address past the limit", () => {
    const full = book(...Array.from({ length: MAX_ADDRESSES }, (_, i): [string, Address] => [`id${i}aaaa`, home]));
    expect(addEntry(full, home, { id: "zzzzzz", address: work }, false)).toEqual({ ok: false, error: "book_full" });
  });

  it("editing the default moves the delivery address with it", () => {
    const b = book(["aaaaaa", home], ["bbbbbb", work]);
    const edited = { ...home, address2: "Flat 3" };
    expect(updateEntry(b, home, "aaaaaa", edited, false)).toMatchObject({ ok: true, newDefault: edited });
    const other = updateEntry(b, home, "bbbbbb", { ...work, address2: "Floor 2" }, false);
    expect(other.ok && other.newDefault).toBeUndefined();
    expect(updateEntry(b, home, "nope00", home, false)).toEqual({ ok: false, error: "not_found" });
  });

  it("removing the default hands it to the next address, or clears it", () => {
    expect(removeEntry(book(["aaaaaa", home], ["bbbbbb", work]), home, "aaaaaa")).toEqual({ ok: true, book: book(["bbbbbb", work]), newDefault: work });
    expect(removeEntry(book(["aaaaaa", home]), home, "aaaaaa")).toEqual({ ok: true, book: book(), newDefault: null });
    expect(removeEntry(book(["aaaaaa", home], ["bbbbbb", work]), home, "bbbbbb")).toEqual({ ok: true, book: book(["aaaaaa", home]) });
    expect(removeEntry(book(), null, "aaaaaa")).toEqual({ ok: false, error: "not_found" });
  });

  it("only an address in the book can become the default", () => {
    expect(makeDefault(book(["aaaaaa", home]), "aaaaaa")).toMatchObject({ ok: true, newDefault: home });
    expect(makeDefault(book(["aaaaaa", home]), "bbbbbb")).toEqual({ ok: false, error: "not_found" });
  });
});

describe("accountMapper", () => {
  const wcShipping = { first_name: "Mona", last_name: "Ali", address_1: "5 Tahrir St", address_2: "", city: "Dokki", state: "EGGZ", postcode: "12611", country: "EG", phone: "" };
  const customer = (extra: Partial<WcCustomerAccount> = {}): WcCustomerAccount => ({
    id: 9, email: "m@x.io", first_name: "Mona", last_name: "Ali", billing: { phone: "01012345678" }, shipping: wcShipping, ...extra,
  });

  it("reads the delivery address, taking billing's phone when shipping has none", () => {
    expect(toDefaultAddress(customer())).toEqual(home);
    expect(toDefaultAddress(customer({ shipping: { ...wcShipping, address_1: "" } }))).toBeNull();
  });

  it("starts the book from the address of an earlier checkout", () => {
    expect(toAddressBook(customer())).toEqual(book([SEEDED_ENTRY_ID, home]));
    // An incomplete one (e.g. no postcode) is not turned into an entry.
    expect(toAddressBook(customer({ shipping: { ...wcShipping, postcode: "" } }))).toEqual(book());
  });

  it("round-trips the stored book and drops malformed entries", () => {
    const meta = toBookMeta(book(["aaaaaa", home]));
    expect(toAddressBook(customer({ meta_data: [meta] }))).toEqual(book(["aaaaaa", home]));
    const junk = JSON.stringify({ v: 1, entries: [{ id: "../x", address: home }, { id: "aaaaaa" }, "x", { id: "bbbbbb", address: work }, { id: "bbbbbb", address: home }] });
    expect(toAddressBook(customer({ meta_data: [{ key: BOOK_META_KEY, value: junk }] }))).toEqual(book(["bbbbbb", work]));
    expect(toAddressBook(customer({ meta_data: [{ key: BOOK_META_KEY, value: "{not json" }] }))).toEqual(book());
    // An emptied book stays empty: the old delivery address does not come back.
    expect(toAddressBook(customer({ meta_data: [toBookMeta(book())] }))).toEqual(book());
  });

  it("writes Egypt for an address and blanks for none", () => {
    expect(toWcAddress(home)).toMatchObject({ address_1: "5 Tahrir St", country: "EG", phone: "01012345678" });
    expect(toWcAddress(null)).toMatchObject({ address_1: "", country: "", state: "" });
  });
});

describe("toAccountFailure", () => {
  const body = (code: string, details?: unknown) => ({ status: 400, data: { error: { code, message: "", details } } });
  it("names the failures the pages show", () => {
    expect(toAccountFailure(body("invalid_address", { phone: "phone_invalid" }))).toEqual({ code: "invalid", fields: { phone: "phone_invalid" } });
    expect(toAccountFailure(body("invalid_profile", { firstName: "required" }))).toEqual({ code: "invalid", fields: { firstName: "required" } });
    expect(toAccountFailure(body("address_book_full")).code).toBe("book_full");
    expect(toAccountFailure(body("not_found")).code).toBe("not_found");
    expect(toAccountFailure(new Error("x")).code).toBe("unavailable");
  });
});
