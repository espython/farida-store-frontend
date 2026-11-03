"use client";
import { useCallback } from "react";
import { useLocale } from "next-intl";
import type { RegistrationInput } from "../domain/credentials";
import type { Session } from "../domain/Session";
import { authApi } from "./authApi";
import { toAuthFailure, type AuthFailure } from "./authFailure";

type Outcome = { ok: true; session: Session } | { ok: false; failure: AuthFailure };

/** Sign-in / register / sign-out use cases for the UI. */
export const useAuthActions = () => {
  const [signInMutation, signInState] = authApi.useSignInMutation();
  const [registerMutation, registerState] = authApi.useRegisterMutation();
  // The confirmation email goes out in the language the customer signed up in.
  const locale = useLocale() === "ar" ? "ar" : "en";
  const [signOutMutation, signOutState] = authApi.useSignOutMutation();

  const signIn = useCallback(
    async (email: string, password: string): Promise<Outcome> => {
      try {
        return { ok: true, session: await signInMutation({ email, password }).unwrap() };
      } catch (error) {
        return { ok: false, failure: toAuthFailure(error as Parameters<typeof toAuthFailure>[0]) };
      }
    },
    [signInMutation]
  );

  const register = useCallback(
    async (input: RegistrationInput): Promise<Outcome> => {
      try {
        return { ok: true, session: await registerMutation({ ...input, locale }).unwrap() };
      } catch (error) {
        return { ok: false, failure: toAuthFailure(error as Parameters<typeof toAuthFailure>[0]) };
      }
    },
    [registerMutation, locale]
  );

  const signOut = useCallback(async () => {
    await signOutMutation();
  }, [signOutMutation]);

  return {
    signIn,
    register,
    signOut,
    pending: signInState.isLoading || registerState.isLoading || signOutState.isLoading,
  };
};
