// A message from the contact form. Pure domain: no React, Redux, Next or WordPress.
// WordPress applies the same limits (infra/wordpress/mu-plugins/farida-contact.php).

export const MAX_CONTACT_NAME = 120;
export const MAX_CONTACT_EMAIL = 254;
export const MAX_CONTACT_MESSAGE = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export type ContactField = keyof ContactMessage;
export type ContactError = "required" | "too_long" | "invalid_email";
export type ContactErrors = Partial<Record<ContactField, ContactError>>;

const length = (s: string) => Array.from(s).length;

/** Trimmed fields, or which ones are wrong (never echoing the input). */
export function validateContactMessage(input: Record<string, unknown>): { ok: true; message: ContactMessage } | { ok: false; errors: ContactErrors } {
  const text = (k: ContactField) => (typeof input[k] === "string" ? (input[k] as string).trim() : "");
  const m = { name: text("name"), email: text("email"), message: text("message") };
  const errors: ContactErrors = {};
  if (!m.name) errors.name = "required";
  else if (length(m.name) > MAX_CONTACT_NAME) errors.name = "too_long";
  if (!m.email) errors.email = "required";
  else if (m.email.length > MAX_CONTACT_EMAIL || !EMAIL_RE.test(m.email)) errors.email = "invalid_email";
  if (!m.message) errors.message = "required";
  else if (length(m.message) > MAX_CONTACT_MESSAGE) errors.message = "too_long";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, message: m };
}
