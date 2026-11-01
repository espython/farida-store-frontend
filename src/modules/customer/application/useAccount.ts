"use client";
import { useCallback } from "react";
import type { Address } from "@/shared/kernel/Address";
import type { ProfileInput } from "../domain/Profile";
import { accountApi } from "./accountApi";
import { toAccountFailure, type AccountResult } from "./accountFailure";
import { useSession } from "./useSession";

const run = async (p: { unwrap: () => Promise<unknown> }): Promise<AccountResult> => {
  try {
    await p.unwrap();
    return { ok: true };
  } catch (error) {
    return { ok: false, failure: toAccountFailure(error) };
  }
};

/** The customer's profile and saving it. `failed` is the shop being unreachable. */
export const useProfile = () => {
  const { status } = useSession();
  const q = accountApi.useGetProfileQuery(undefined, { skip: status !== "signedIn" });
  const [update, state] = accountApi.useUpdateProfileMutation();
  return {
    profile: q.data ?? null,
    signedOut: status === "signedOut",
    loading: status === "loading" || q.isLoading,
    failed: q.isError,
    retry: q.refetch,
    saving: state.isLoading,
    save: useCallback((input: ProfileInput) => run(update(input)), [update]),
  };
};

/** The customer's address book and its use cases. */
export const useAddressBook = () => {
  const { status } = useSession();
  const q = accountApi.useGetAddressBookQuery(undefined, { skip: status !== "signedIn" });
  const [add, addState] = accountApi.useAddAddressMutation();
  const [update, updateState] = accountApi.useUpdateAddressMutation();
  const [remove, removeState] = accountApi.useRemoveAddressMutation();
  const [setDefault, defaultState] = accountApi.useSetDefaultAddressMutation();
  return {
    book: q.data ?? null,
    signedOut: status === "signedOut",
    loading: status === "loading" || q.isLoading,
    failed: q.isError,
    retry: q.refetch,
    busy: addState.isLoading || updateState.isLoading || removeState.isLoading || defaultState.isLoading,
    add: useCallback((address: Address, makeDefault: boolean) => run(add({ address, makeDefault })), [add]),
    update: useCallback((id: string, address: Address, makeDefault: boolean) => run(update({ id, address, makeDefault })), [update]),
    remove: useCallback((id: string) => run(remove(id)), [remove]),
    setDefault: useCallback((id: string) => run(setDefault(id)), [setDefault]),
  };
};
