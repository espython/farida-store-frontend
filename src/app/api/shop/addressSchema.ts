import { z } from "zod";

const field = z.string().max(200);

/** An Egyptian address as the UI sends it; the domain rules (validateAddress) run after this. */
export const addressSchema = z.object({
  firstName: field,
  lastName: field,
  address1: field,
  address2: field,
  city: field,
  state: z.string().max(10),
  postcode: z.string().max(10),
  phone: z.string().max(30),
});
