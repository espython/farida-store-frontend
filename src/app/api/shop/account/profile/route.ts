import { z } from "zod";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { cleanProfile, getProfile, updateProfile, validateProfile } from "@/modules/customer/index.server";
import { verifiedCaller } from "../../cart/cartRoute";
import { accountResponse } from "../accountRoute";

const body = z.object({ firstName: z.string().max(200), lastName: z.string().max(200) });

// The signed-in customer's profile. The id is verified with WordPress: the
// customer is read and written with the server keys.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const { customerId } = await verifiedCaller(req);
    return accountResponse({ profile: await getProfile(customerId) });
  },
  PUT: async (req) => {
    const input = await parseJson(req, body);
    const errors = validateProfile(input);
    if (Object.keys(errors).length) throw new AppError("invalid_profile", "Check your details", 400, errors);
    const { customerId } = await verifiedCaller(req);
    return accountResponse({ profile: await updateProfile(customerId, cleanProfile(input)) });
  },
});
