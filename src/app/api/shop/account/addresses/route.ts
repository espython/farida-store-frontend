import { z } from "zod";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { addAddress, getAddressBook } from "@/modules/customer/index.server";
import { verifiedCaller } from "../../cart/cartRoute";
import { addressSchema } from "../../addressSchema";
import { accountResponse, checkedAddress } from "../accountRoute";

const body = z.object({ address: addressSchema, makeDefault: z.boolean().optional() });

// The signed-in customer's address book (verified id, server keys).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const { customerId } = await verifiedCaller(req);
    return accountResponse({ book: await getAddressBook(customerId) });
  },
  POST: async (req) => {
    const { address, makeDefault } = await parseJson(req, body);
    const clean = checkedAddress(address);
    const { customerId } = await verifiedCaller(req);
    return accountResponse({ book: await addAddress(customerId, clean, makeDefault ?? false) });
  },
});
