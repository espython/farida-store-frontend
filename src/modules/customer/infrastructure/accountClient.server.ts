import { randomBytes } from "node:crypto";
import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import type { Address } from "@/shared/kernel/Address";
import {
  addEntry,
  makeDefault,
  MAX_ADDRESSES,
  removeEntry,
  toSavedAddresses,
  updateEntry,
  type AddressBook,
  type AddressBookView,
  type BookChange,
} from "../domain/AddressBook";
import type { Profile, ProfileInput } from "../domain/Profile";
import { toAddressBook, toBookMeta, toDefaultAddress, toProfile, toWcAddress } from "./accountMapper";
import type { WcCustomerAccount, WcCustomerUpdate } from "./wcCustomerDto";

// The account is read and written with the server keys (customers cannot use
// wc/v3), so the id must come from a session WordPress verified
// (verifiedCaller in app/api). It is the only id used: there is no customer id
// in any request, so one customer cannot name another's account.
const requireCustomer = (customerId: string) => {
  if (!/^[1-9]\d*$/.test(customerId)) throw new AppError("unauthenticated", "Sign in to see your account", 401);
};

const FIELDS = "id,email,first_name,last_name,billing,shipping,meta_data";

async function readCustomer(customerId: string): Promise<WcCustomerAccount> {
  requireCustomer(customerId);
  const { data } = await wooFetch<WcCustomerAccount>({
    path: `/wc/v3/customers/${customerId}`,
    auth: "keys",
    query: { _fields: FIELDS },
  });
  return data;
}

async function writeCustomer(customerId: string, body: WcCustomerUpdate): Promise<WcCustomerAccount> {
  requireCustomer(customerId);
  const { data } = await wooFetch<WcCustomerAccount>({
    method: "PUT",
    path: `/wc/v3/customers/${customerId}`,
    auth: "keys",
    query: { _fields: FIELDS },
    body,
  });
  return data;
}

// The book is one meta value: changes are read-modify-write, so they run one
// at a time per customer. In-memory, like the checkout guard: one Node
// instance (W1 hosting).
const queues = new Map<string, Promise<unknown>>();
async function serialized<T>(customerId: string, fn: () => Promise<T>): Promise<T> {
  const run = (queues.get(customerId) ?? Promise.resolve()).catch(() => undefined).then(fn);
  const tail = run.catch(() => undefined);
  queues.set(customerId, tail);
  try {
    return await run;
  } finally {
    if (queues.get(customerId) === tail) queues.delete(customerId);
  }
}

const view = (dto: WcCustomerAccount): AddressBookView => ({
  addresses: toSavedAddresses(toAddressBook(dto), toDefaultAddress(dto)),
  limit: MAX_ADDRESSES,
});

const BOOK_ERRORS = {
  not_found: () => new AppError("not_found", "Not found", 404),
  book_full: () => new AppError("address_book_full", `Up to ${MAX_ADDRESSES} addresses`, 409),
};

/** Apply a domain change to the stored book (and the delivery address when it moves). */
function change(customerId: string, decide: (book: AddressBook, current: Address | null) => BookChange): Promise<AddressBookView> {
  return serialized(customerId, async () => {
    const dto = await readCustomer(customerId);
    const result = decide(toAddressBook(dto), toDefaultAddress(dto));
    if (!result.ok) throw BOOK_ERRORS[result.error]();
    const body: WcCustomerUpdate = { meta_data: [toBookMeta(result.book)] };
    if (result.newDefault !== undefined) {
      // Checkout uses shipping for delivery and billing for the invoice; it
      // saves both from one address, so the book does the same.
      // Registration leaves the billing email empty; orders need one.
      const a = toWcAddress(result.newDefault);
      body.shipping = a;
      body.billing = dto.billing?.email ? a : { ...a, email: dto.email };
    }
    return view(await writeCustomer(customerId, body));
  });
}

const newEntryId = () => randomBytes(8).toString("hex");

export async function getProfile(customerId: string): Promise<Profile> {
  return toProfile(await readCustomer(customerId));
}

export async function updateProfile(customerId: string, input: ProfileInput): Promise<Profile> {
  return toProfile(await writeCustomer(customerId, { first_name: input.firstName, last_name: input.lastName }));
}

export async function getAddressBook(customerId: string): Promise<AddressBookView> {
  return view(await readCustomer(customerId));
}

export const addAddress = (customerId: string, address: Address, asDefault: boolean) =>
  change(customerId, (book, current) => addEntry(book, current, { id: newEntryId(), address }, asDefault));

export const updateAddress = (customerId: string, id: string, address: Address, asDefault: boolean) =>
  change(customerId, (book, current) => updateEntry(book, current, id, address, asDefault));

export const removeAddress = (customerId: string, id: string) => change(customerId, (book, current) => removeEntry(book, current, id));

export const setDefaultAddress = (customerId: string, id: string) => change(customerId, (book) => makeDefault(book, id));
