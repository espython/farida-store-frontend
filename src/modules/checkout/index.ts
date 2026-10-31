// Public API of the checkout context (client-safe). Server code is in ./index.server.
export type { Address, AddressError } from "./domain/Address";
export { emptyAddress, isAddressComplete, normalisePhone, validateAddress } from "./domain/Address";
export { GOVERNORATES, governorateName } from "./domain/governorates";
export type { AppliedCoupon, Checkout, CheckoutTotals, PaymentMethod, PlacedOrder, ShippingRate } from "./domain/Checkout";

export { checkoutApi } from "./application/checkoutApi";
export { useCheckout, usePlacedOrder } from "./application/useCheckout";
export type { StepResult } from "./application/useCheckout";
export type { CheckoutFailure, CheckoutFailureCode } from "./application/checkoutFailure";

export { default as ShippingStep } from "./ui/ShippingStep";
export { default as PaymentStep } from "./ui/PaymentStep";
export { default as OrderConfirmation } from "./ui/OrderConfirmation";
