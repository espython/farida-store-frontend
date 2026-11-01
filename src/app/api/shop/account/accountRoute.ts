import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { cleanAddress, validateAddress, type Address } from "@/shared/kernel/Address";

/** Account data is the customer's own: never cached anywhere. */
export const accountResponse = (body: unknown) => NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });

/** The domain rules, with the failing fields in the error details (the form puts them on its fields). */
export function checkedAddress(address: Address): Address {
  const errors = validateAddress(address);
  if (Object.keys(errors).length) throw new AppError("invalid_address", "Check the address", 400, errors);
  return cleanAddress(address);
}
