import { z } from "zod";
import { PASSWORD_MAX_LENGTH } from "@/modules/customer/index.server";

// Shape only; the business rules (password policy, email format) are the
// customer domain's and are applied in the routes so errors carry its codes.
export const loginBody = z.object({
  email: z.string().max(254),
  password: z.string().max(PASSWORD_MAX_LENGTH),
});

export const registerBody = z.object({
  email: z.string().max(254),
  password: z.string().max(PASSWORD_MAX_LENGTH),
  firstName: z.string().max(100),
  lastName: z.string().max(100),
});
