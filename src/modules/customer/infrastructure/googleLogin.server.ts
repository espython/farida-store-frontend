import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import type { GoogleIdentity } from "../domain/googleSignIn";
import type { SignedIn } from "./authClient.server";
import { decodeJwtPayload, toSession } from "./sessionMapper";
import type { WpErrorBody, WpGoogleLoginRequest, WpTokenResponse } from "./wpAuthDto";

const CODES: Record<string, string> = {
  farida_not_customer: "google_staff",
  farida_google_conflict: "google_conflict",
};

/**
 * Sign in the customer Google vouched for (farida-account mu-plugin, server
 * keys): linked account, else the account with this email, else a new one.
 */
export async function signInWithGoogle(identity: GoogleIdentity): Promise<SignedIn> {
  const body: WpGoogleLoginRequest = identity;
  const { data } = await wooFetch<WpTokenResponse>({
    method: "POST",
    path: "/wc-farida/v1/google/login",
    auth: "keys",
    body,
    mapError: (status, payload) => {
      const code = CODES[((payload ?? {}) as WpErrorBody).code ?? ""];
      return code ? new AppError(code, "Google sign-in refused", status) : undefined;
    },
  });
  const payload = data?.token ? decodeJwtPayload(data.token) : null;
  if (!payload) throw new AppError("upstream_error", "Unexpected sign-in response", 502);
  return { token: data.token, session: toSession(data, payload) };
}
