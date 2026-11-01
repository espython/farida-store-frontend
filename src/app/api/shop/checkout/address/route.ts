import { z } from "zod";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { cleanAddress, setAddress, validateAddress } from "@/modules/checkout/index.server";
import { cartCaller } from "../../cart/cartRoute";
import { checkoutResponse } from "../checkoutRoute";
import { addressSchema } from "../../addressSchema";

const body = z.object({ address: addressSchema });

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  PUT: async (req) => {
    const caller = cartCaller(req);
    const { address } = await parseJson(req, body);
    const errors = validateAddress(address);
    if (Object.keys(errors).length) throw new AppError("invalid_address", "Check the delivery address", 400, errors);
    return checkoutResponse(caller.customerId, await setAddress(caller, cleanAddress(address)));
  },
});
