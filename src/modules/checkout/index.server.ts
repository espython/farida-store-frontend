// Server entry of the checkout context. Import only from app/api and server components.
export {
  applyCoupon,
  getCheckout,
  placeOrder,
  removeCoupon,
  selectShippingRate,
  setAddress,
} from "./infrastructure/checkoutClient.server";
export type { CheckoutResult } from "./infrastructure/checkoutClient.server";
export { placeOnce } from "./infrastructure/checkoutGuard.server";
export { cleanAddress, validateAddress } from "@/shared/kernel/Address";
export { isIdempotencyKey } from "./domain/idempotency";
