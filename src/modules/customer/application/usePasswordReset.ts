"use client";
import { useCallback } from "react";
import { useLocale } from "next-intl";
import type { ResetLink } from "../domain/passwordReset";
import type { Session } from "../domain/Session";
import { authApi } from "./authApi";
import { toAuthFailure, type AuthFailure } from "./authFailure";

type Sent = { ok: true } | { ok: false; failure: AuthFailure };
type Reset = { ok: true; session: Session } | { ok: false; failure: AuthFailure };

/**
 * Forgot / reset password use cases. `requestReset` succeeds the same way
 * whether or not the email has an account; `reset` signs the customer in.
 */
export const usePasswordReset = () => {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const [requestMutation, requestState] = authApi.useRequestPasswordResetMutation();
  const [resetMutation, resetState] = authApi.useResetPasswordMutation();

  const requestReset = useCallback(
    async (email: string): Promise<Sent> => {
      try {
        await requestMutation({ email, locale }).unwrap();
        return { ok: true };
      } catch (error) {
        return { ok: false, failure: toAuthFailure(error as Parameters<typeof toAuthFailure>[0]) };
      }
    },
    [requestMutation, locale]
  );

  const reset = useCallback(
    async (link: ResetLink, password: string): Promise<Reset> => {
      try {
        return { ok: true, session: await resetMutation({ ...link, password }).unwrap() };
      } catch (error) {
        return { ok: false, failure: toAuthFailure(error as Parameters<typeof toAuthFailure>[0]) };
      }
    },
    [resetMutation]
  );

  return { requestReset, reset, sending: requestState.isLoading, resetting: resetState.isLoading };
};
