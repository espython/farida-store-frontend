import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import { AUTH_ERROR_STATUS } from "../domain/authErrors";
import { normaliseEmail } from "../domain/credentials";
import type { ResetLink } from "../domain/passwordReset";
import { login, type SignedIn } from "./authClient.server";
import type { WpErrorBody, WpPasswordForgotRequest, WpPasswordResetRequest, WpPasswordResetResponse } from "./wpAuthDto";

// Password reset through the farida-account mu-plugin (infra/wordpress), with
// the server keys. WordPress emails the link and checks the key; the storefront
// only forwards. Its forgot route answers the same for every email.

/** Ask WordPress to email a reset link to the customer with this email, if there is one. */
export async function requestPasswordReset(email: string, locale: "en" | "ar", resetUrl: string): Promise<void> {
  const body: WpPasswordForgotRequest = { email: normaliseEmail(email), locale, resetUrl };
  await wooFetch({ method: "POST", path: "/wc-farida/v1/password/forgot", auth: "keys", body });
}

const mapResetError = (status: number, payload: unknown) => {
  const code = ((payload ?? {}) as WpErrorBody).code ?? "";
  if (status === 400 && code === "farida_invalid_reset_key") {
    return new AppError("invalid_reset_link", "The reset link is invalid or has expired", AUTH_ERROR_STATUS.invalid_reset_link);
  }
  if (status === 400 && code === "farida_weak_password") {
    return new AppError("invalid_input", "Choose another password", AUTH_ERROR_STATUS.invalid_input, { password: "password_too_short" });
  }
  return undefined;
};

/**
 * Set the new password with the emailed key, then sign the customer in with it.
 * WordPress signs out every token issued before the change.
 */
export async function resetPassword(link: ResetLink, password: string): Promise<SignedIn> {
  const body: WpPasswordResetRequest = { login: link.login, key: link.key, password };
  const { data } = await wooFetch<WpPasswordResetResponse>({
    method: "POST",
    path: "/wc-farida/v1/password/reset",
    auth: "keys",
    body,
    mapError: mapResetError,
  });
  if (!data?.email) throw new AppError("upstream_error", "Unexpected reset response", 502);
  return login(data.email, password);
}
