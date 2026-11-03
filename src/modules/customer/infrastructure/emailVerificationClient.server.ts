import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import { AUTH_ERROR_STATUS } from "../domain/authErrors";
import type { VerificationSent, VerifyLink } from "../domain/emailVerification";
import type { WpEmailSendRequest, WpEmailSendResponse, WpEmailVerifyRequest, WpErrorBody } from "./wpAuthDto";

// Email confirmation through the farida-account mu-plugin (infra/wordpress), with the server keys.

/** Email the customer a confirmation link, unless they are confirmed or were emailed in the last minute. */
export async function sendEmailVerification(customerId: string, locale: "en" | "ar", verifyUrl: string): Promise<VerificationSent> {
  const body: WpEmailSendRequest = { customerId: Number(customerId), locale, verifyUrl };
  const { data } = await wooFetch<WpEmailSendResponse>({ method: "POST", path: "/wc-farida/v1/email/send", auth: "keys", body });
  return data?.status === "recent" || data?.status === "verified" ? data.status : "sent";
}

const invalidLink = () => new AppError("invalid_verify_link", "The confirmation link is invalid or has expired", AUTH_ERROR_STATUS.invalid_verify_link);

/** Confirm the email with the link's token. Works without a session: the token is the proof. */
export async function verifyEmail(link: VerifyLink): Promise<void> {
  const body: WpEmailVerifyRequest = { id: Number(link.id), token: link.token };
  await wooFetch({
    method: "POST",
    path: "/wc-farida/v1/email/verify",
    auth: "keys",
    body,
    mapError: (status, payload) =>
      status === 400 && ((payload ?? {}) as WpErrorBody).code === "farida_invalid_verify_token" ? invalidLink() : undefined,
  });
}
