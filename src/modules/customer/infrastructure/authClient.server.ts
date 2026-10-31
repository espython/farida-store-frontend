import { randomBytes } from "node:crypto";
import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import { AUTH_ERROR_STATUS, type AuthErrorCode } from "../domain/authErrors";
import { normaliseEmail, type RegistrationInput } from "../domain/credentials";
import { isSessionExpired, type Session } from "../domain/Session";
import { decodeJwtPayload, toSession, toSessionFromUser } from "./sessionMapper";
import type { WooCustomer, WooCustomerCreate, WpErrorBody, WpTokenResponse, WpUserMe } from "./wpAuthDto";

export interface SignedIn {
  /** Goes into the httpOnly cookie only; never into a response body. */
  token: string;
  session: Session;
}

const authError = (code: AuthErrorCode, message: string) => new AppError(code, message, AUTH_ERROR_STATUS[code]);

const codeOf = (payload: unknown) => ((payload ?? {}) as WpErrorBody).code ?? "";

// The JWT plugin answers 403 with different codes for an unknown email
// ("invalid_email"/"invalid_username") and a wrong password
// ("incorrect_password"). Both become invalid_credentials so the sign-in form
// cannot be used to find out who has an account.
const mapTokenError = (status: number, payload: unknown) =>
  status === 403 && codeOf(payload).startsWith("[jwt_auth]")
    ? authError("invalid_credentials", "Invalid email or password")
    : undefined;

export async function login(email: string, password: string): Promise<SignedIn> {
  const { data } = await wooFetch<WpTokenResponse>({
    method: "POST",
    path: "/jwt-auth/v1/token",
    body: { username: normaliseEmail(email), password },
    mapError: mapTokenError,
  });
  const payload = data?.token ? decodeJwtPayload(data.token) : null;
  if (!payload) throw new AppError("upstream_error", "Unexpected sign-in response", 502);
  return { token: data.token, session: toSession(data, payload) };
}

// Woo refuses a duplicate email with this code (seen on staging, spike-auth).
const mapRegisterError = (status: number, payload: unknown) => {
  const code = codeOf(payload);
  if (status === 400 && code === "registration-error-email-exists") {
    return authError("email_taken", "An account with this email already exists");
  }
  if (status === 400 && code.startsWith("registration-error")) {
    return authError("invalid_input", "Registration details were rejected");
  }
  return undefined;
};

/** Create the customer with the server keys, then sign them in. */
export async function register(input: RegistrationInput): Promise<SignedIn> {
  const email = normaliseEmail(input.email);
  const body: WooCustomerCreate = {
    email,
    password: input.password,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    // Customers sign in with their email; the username is internal and must
    // not leak the email into public author URLs.
    username: `c_${randomBytes(6).toString("hex")}`,
  };
  await wooFetch<WooCustomer>({
    method: "POST",
    path: "/wc/v3/customers",
    auth: "keys",
    body,
    mapError: mapRegisterError,
  });
  return login(email, input.password);
}

/**
 * Load the customer behind a token. WordPress checks the signature, expiry and
 * user while answering users/me, so only then are the token's claims trusted.
 * Returns null for anything unusable (expired, tampered, user deleted).
 */
export async function getSession(token: string): Promise<Session | null> {
  const payload = decodeJwtPayload(token);
  if (!payload || isSessionExpired({ expiresAt: payload.exp })) return null;
  let user: WpUserMe;
  try {
    ({ data: user } = await wooFetch<WpUserMe>({
      path: "/wp/v2/users/me",
      query: { context: "edit", _fields: "id,name,email" },
      headers: { Authorization: `Bearer ${token}` },
      mapError: (status) =>
        status === 401 || status === 403 ? authError("unauthenticated", "Session expired") : undefined,
    }));
  } catch (err) {
    if (err instanceof AppError && err.code === "unauthenticated") return null;
    throw err;
  }
  // The token must belong to the user WordPress resolved it to.
  if (!user || String(user.id) !== String(payload.data.user.id)) return null;
  return toSessionFromUser(user, payload);
}
