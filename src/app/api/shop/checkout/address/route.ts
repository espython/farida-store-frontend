import { z } from "zod";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { cleanAddress, setAddress, validateAddress } from "@/modules/checkout/index.server";
import { cartCaller } from "../../cart/cartRoute";
import { checkoutResponse } from "../checkoutRoute";

const field = z.string().max(200);
const body = z.object({
  address: z.object({
    firstName: field,
    lastName: field,
    address1: field,
    address2: field,
    city: field,
    state: z.string().max(10),
    postcode: z.string().max(10),
    phone: z.string().max(30),
  }),
});

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  PUT: async (req) => {
    const caller = cartCaller(req);
    const { address } = await parseJson(req, body);
    const errors = validateAddress(address);
    if (Object.keys(errors).length) throw new AppError("invalid_address", "Check the delivery address", 400, errors);
    return checkoutResponse(caller.customerId, await setAddress(caller, cleanAddress(address)));
  },
});
