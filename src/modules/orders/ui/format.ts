import { governorateName } from "@/shared/kernel/Governorate";
import type { DeliveryAddress } from "../domain/Order";

export const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

/** "5 Tahrir St, building 2, Dokki — Giza", governorate in the page's language. */
export const formatAddress = (a: DeliveryAddress, locale: "en" | "ar", separator = ", ") => {
  const street = [a.address1, a.address2, a.city].filter(Boolean).join(separator);
  const governorate = a.state ? governorateName(a.state, locale) : "";
  return [street, governorate].filter(Boolean).join(" — ");
};
