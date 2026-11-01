import { AppError } from "@/shared/kernel/AppError";
import { defineRoute } from "@/shared/infrastructure/bff";
import { isEntryId, setDefaultAddress } from "@/modules/customer/index.server";
import { verifiedCaller } from "../../../../cart/cartRoute";
import { accountResponse } from "../../../accountRoute";

type Ctx = { params: { id: string } };

// Make one of the customer's own addresses the one checkout starts from.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute<Ctx>({
  POST: async (req, ctx) => {
    if (!isEntryId(ctx.params.id)) throw new AppError("not_found", "Not found", 404);
    const { customerId } = await verifiedCaller(req);
    return accountResponse({ book: await setDefaultAddress(customerId, ctx.params.id) });
  },
});
