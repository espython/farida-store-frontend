"use client";
import { useCallback } from "react";
import { useLocale } from "next-intl";
import { useAppDispatch } from "@/store/hooks";
import type { VerificationSent, VerifyLink } from "../domain/emailVerification";
import { accountApi } from "./accountApi";
import { authApi } from "./authApi";
import { toAuthFailure, type AuthFailure } from "./authFailure";

type Resent = { ok: true; status: VerificationSent } | { ok: false; failure: AuthFailure };
type Verified = { ok: true } | { ok: false; failure: AuthFailure };

/**
 * Email confirmation use cases: send the link again (signed in), and confirm
 * with the link (signed in or not). Confirming refreshes the profile, so the
 * reminder disappears.
 */
export const useEmailVerification = () => {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const dispatch = useAppDispatch();
  const [resendMutation, resendState] = authApi.useResendVerificationMutation();
  const [verifyMutation, verifyState] = authApi.useVerifyEmailMutation();

  const resend = useCallback(async (): Promise<Resent> => {
    try {
      return { ok: true, status: await resendMutation({ locale }).unwrap() };
    } catch (error) {
      return { ok: false, failure: toAuthFailure(error as Parameters<typeof toAuthFailure>[0]) };
    }
  }, [resendMutation, locale]);

  const verify = useCallback(
    async (link: VerifyLink): Promise<Verified> => {
      try {
        await verifyMutation(link).unwrap();
        dispatch(accountApi.util.invalidateTags([{ type: "Account", id: "PROFILE" }]));
        return { ok: true };
      } catch (error) {
        return { ok: false, failure: toAuthFailure(error as Parameters<typeof toAuthFailure>[0]) };
      }
    },
    [verifyMutation, dispatch]
  );

  return { resend, resending: resendState.isLoading, verify, verifying: verifyState.isLoading };
};
