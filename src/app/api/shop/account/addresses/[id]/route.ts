import { z } from "zod";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { isEntryId, removeAddress, updateAddress } from "@/modules/customer/index.server";
import { verifiedCaller } from "../../../cart/cartRoute";
import { addressSchema } from "../../../addressSchema";
import { accountResponse, checkedAddress } from "../../accountRoute";

type Ctx = { params: { id: string } };

const body = z.object({ address: addressSchema, makeDefault: z.boolean().optional() });

const entryId = (ctx: Ctx) => {
  if (!isEntryId(ctx.params.id)) throw new AppError("not_found", "Not found", 404);
  return ctx.params.id;
};

// One address in the signed-in customer's own book; ids are looked up only
// there, so another customer's id is simply not found.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute<Ctx>({
  PUT: async (req, ctx) => {
    const id = entryId(ctx);
    const { address, makeDefault } = await parseJson(req, body);
    const clean = checkedAddress(address);
    const { customerId } = await verifiedCaller(req);
    return accountResponse({ book: await updateAddress(customerId, id, clean, makeDefault ?? false) });
  },
  DELETE: async (req, ctx) => {
    const id = entryId(ctx);
    const { customerId } = await verifiedCaller(req);
    return accountResponse({ book: await removeAddress(customerId, id) });
  },
});
