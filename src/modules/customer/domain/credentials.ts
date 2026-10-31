/**
 * Sign-in and registration input rules. Shared by the BFF (authoritative) and
 * the forms (A2), so both reject the same input with the same codes.
 */

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;
const NAME_MAX_LENGTH = 60;
const EMAIL_MAX_LENGTH = 254;
// Deliberately simple: the real check is the confirmation email (A2).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type CredentialError =
  | "email_invalid"
  | "password_too_short"
  | "password_too_long"
  | "password_needs_uppercase"
  | "password_needs_number"
  | "name_required"
  | "name_too_long";

export interface RegistrationInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export type FieldErrors<K extends string> = Partial<Record<K, CredentialError>>;

/** Trimmed and lower-cased; WordPress matches emails case-insensitively. */
export const normaliseEmail = (email: string) => email.trim().toLowerCase();

export const emailError = (email: string): CredentialError | null => {
  const e = normaliseEmail(email);
  return e.length > 0 && e.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(e) ? null : "email_invalid";
};

/** Same rule the current register form states: 6+ characters, an uppercase letter, a number. */
export const passwordError = (password: string): CredentialError | null => {
  if (password.length < PASSWORD_MIN_LENGTH) return "password_too_short";
  if (password.length > PASSWORD_MAX_LENGTH) return "password_too_long";
  if (!/[A-Z]/.test(password)) return "password_needs_uppercase";
  if (!/\d/.test(password)) return "password_needs_number";
  return null;
};

const nameError = (name: string): CredentialError | null => {
  const n = name.trim();
  if (!n) return "name_required";
  return n.length > NAME_MAX_LENGTH ? "name_too_long" : null;
};

export const validateRegistration = (input: RegistrationInput): FieldErrors<keyof RegistrationInput> => {
  const errors: FieldErrors<keyof RegistrationInput> = {};
  const checks: [keyof RegistrationInput, CredentialError | null][] = [
    ["email", emailError(input.email)],
    ["password", passwordError(input.password)],
    ["firstName", nameError(input.firstName)],
    ["lastName", nameError(input.lastName)],
  ];
  for (const [field, error] of checks) if (error) errors[field] = error;
  return errors;
};

/**
 * Sign-in only checks shape. Password rules are not applied: accounts made
 * under older rules (or migrated in M4) must still be able to sign in.
 */
export const validateLogin = (email: string, password: string): FieldErrors<"email" | "password"> => {
  const errors: FieldErrors<"email" | "password"> = {};
  const e = emailError(email);
  if (e) errors.email = e;
  if (!password || password.length > PASSWORD_MAX_LENGTH) errors.password = "password_too_short";
  return errors;
};
