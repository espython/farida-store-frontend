// Server entry of the customer context. Import only from app/api and server components.
export { getSession, login, register } from "./infrastructure/authClient.server";
export type { SignedIn } from "./infrastructure/authClient.server";
export { requestPasswordReset, resetPassword } from "./infrastructure/passwordClient.server";
export { toResetLink } from "./domain/passwordReset";
export { sendEmailVerification, verifyEmail } from "./infrastructure/emailVerificationClient.server";
export { toVerifyLink } from "./domain/emailVerification";
export { checkGoogleClaims } from "./domain/googleSignIn";
export { safeNextPath } from "./domain/routeAccess";
export type { GoogleSignInError } from "./domain/googleSignIn";
export { signInWithGoogle } from "./infrastructure/googleLogin.server";
export {
  clearGoogleFlowCookie,
  exchangeGoogleCode,
  GOOGLE_CALLBACK_PATH,
  googleAuthorizeUrl,
  googleConfig,
  newGoogleFlow,
  readGoogleFlow,
  setGoogleFlowCookie,
} from "./infrastructure/googleOAuth.server";
export {
  clearSessionCookies,
  FLAG_COOKIE,
  readSessionClaims,
  readSessionToken,
  setSessionCookies,
  TOKEN_COOKIE,
} from "./infrastructure/sessionCookie.server";

// Domain rules the routes apply (server-safe; the client index also has hooks).
export { emailError, normaliseEmail, passwordError, validateLogin, validateRegistration, PASSWORD_MAX_LENGTH } from "./domain/credentials";

// Account (A4): profile and address book on the Woo customer, server keys.
export {
  addAddress,
  getAddressBook,
  getProfile,
  removeAddress,
  setDefaultAddress,
  updateAddress,
  updateProfile,
} from "./infrastructure/accountClient.server";
export { cleanProfile, validateProfile } from "./domain/Profile";
export { isEntryId } from "./domain/AddressBook";
