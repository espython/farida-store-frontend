import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import type { Locale } from "@/shared/kernel/Locale";
import type { ContactMessage } from "../domain/ContactMessage";

/**
 * Saves a contact message in WordPress ("Contact messages" in the admin).
 * Only this server can: the route checks CONTACT_SHARED_SECRET. The owner is
 * emailed once the mail service exists (W6 #231).
 */
export async function sendContactMessage(message: ContactMessage, locale: Locale | null): Promise<void> {
  const secret = process.env.CONTACT_SHARED_SECRET;
  if (!secret) throw new AppError("internal_error", "Contact service unavailable", 503);
  await wooFetch({
    method: "POST",
    path: "/farida/v1/contact",
    headers: { "X-Farida-Contact-Secret": secret },
    body: { ...message, locale },
    // WordPress's own limit; anything else (403 wrong secret, 5xx) is our fault, a 502.
    mapError: (status) => (status === 429 ? new AppError("rate_limited", "Too many messages, please try again later", 429) : undefined),
  });
}
