import { AppError } from "@/shared/kernel/AppError";
import { defineRoute } from "@/shared/infrastructure/bff";
import { addToWishlist, isProductId, removeFromWishlist } from "@/modules/wishlist/index.server";
import { verifiedCaller } from "../../../cart/cartRoute";
import { wishlistResponse } from "../../wishlistRoute";

type Ctx = { params: { productId: string } };

const productId = (ctx: Ctx) => {
  if (!isProductId(ctx.params.productId)) throw new AppError("not_found", "No such product", 404);
  return ctx.params.productId;
};

// Save (PUT, idempotent) or remove (DELETE) one product.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute<Ctx>({
  PUT: async (req, ctx) => {
    const id = productId(ctx);
    const { customerId } = await verifiedCaller(req);
    return wishlistResponse({ wishlist: await addToWishlist(customerId, id) });
  },
  DELETE: async (req, ctx) => {
    const id = productId(ctx);
    const { customerId } = await verifiedCaller(req);
    return wishlistResponse({ wishlist: await removeFromWishlist(customerId, id) });
  },
});
