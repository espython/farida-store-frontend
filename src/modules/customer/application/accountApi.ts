"use client";
import { baseApi } from "@/shared/infrastructure/baseApi";
import type { Address } from "@/shared/kernel/Address";
import type { AddressBookView } from "../domain/AddressBook";
import type { Profile, ProfileInput } from "../domain/Profile";
import { authApi } from "./authApi";

type BookBody = { book: AddressBookView };
type EntryInput = { address: Address; makeDefault: boolean };

/**
 * The signed-in customer's profile and address book (/api/shop/account).
 * Every book change answers with the whole book, which replaces the cached
 * one; the default address is what checkout starts from, so it is refetched.
 */
export const accountApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    const bookChange = <A>(query: (arg: A) => { url: string; method: string; body?: unknown }) =>
      build.mutation<AddressBookView, A>({
        query,
        transformResponse: (b: BookBody) => b.book,
        invalidatesTags: ["Checkout"],
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(accountApi.util.upsertQueryData("getAddressBook", undefined, data));
          } catch {
            // The form shows the failure; the cached book is unchanged.
          }
        },
      });
    return {
      getProfile: build.query<Profile, void>({
        query: () => "account/profile",
        transformResponse: (b: { profile: Profile }) => b.profile,
        providesTags: [{ type: "Account", id: "PROFILE" }],
      }),
      updateProfile: build.mutation<Profile, ProfileInput>({
        query: (body) => ({ url: "account/profile", method: "PUT", body }),
        transformResponse: (b: { profile: Profile }) => b.profile,
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(accountApi.util.upsertQueryData("getProfile", undefined, data));
            // The header greets the customer by name (from the session).
            dispatch(authApi.util.invalidateTags(["Session"]));
          } catch {
            // The form shows the failure.
          }
        },
      }),
      getAddressBook: build.query<AddressBookView, void>({
        query: () => "account/addresses",
        transformResponse: (b: BookBody) => b.book,
        providesTags: [{ type: "Address", id: "LIST" }],
      }),
      addAddress: bookChange((body: EntryInput) => ({ url: "account/addresses", method: "POST", body })),
      updateAddress: bookChange(({ id, ...body }: EntryInput & { id: string }) => ({
        url: `account/addresses/${encodeURIComponent(id)}`,
        method: "PUT",
        body,
      })),
      removeAddress: bookChange((id: string) => ({ url: `account/addresses/${encodeURIComponent(id)}`, method: "DELETE" })),
      setDefaultAddress: bookChange((id: string) => ({ url: `account/addresses/${encodeURIComponent(id)}/default`, method: "POST" })),
    };
  },
});
