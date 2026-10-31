"use client";
import { useCallback } from "react";
import type { RegistrationInput } from "../domain/credentials";
import type { Session } from "../domain/Session";
import { authApi } from "./authApi";
import { toAuthFailure, type AuthFailure } from "./authFailure";

type Outcome = { ok: true; session: Session } | { ok: false; failure: AuthFailure };

/** Sign-in / register / sign-out use cases for the UI. */
export const useAuthActions = () => {
  const [signInMutation, signInState] = authApi.useSignInMutation();
  const [registerMutation, registerState] = authApi.useRegisterMutation();
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
        return { ok: true, session: await registerMutation(input).unwrap() };
      } catch (error) {
        return { ok: false, failure: toAuthFailure(error as Parameters<typeof toAuthFailure>[0]) };
      }
    },
    [registerMutation]
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
