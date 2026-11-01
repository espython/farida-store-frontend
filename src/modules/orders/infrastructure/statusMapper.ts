import type { OrderPayment, OrderStatus } from "../domain/Order";

// Woo order statuses (REST, without the "wc-" prefix) → the shop's statuses.
// "out-for-delivery" is registered by the shop's WordPress (mu-plugin
// farida-order-statuses, infra/woo-staging/setup.sh). On hold is an order the
// owner paused; to the customer it is still placed.
const STATUSES: Record<string, OrderStatus> = {
  pending: "awaiting_payment",
  processing: "placed",
  "on-hold": "placed",
  "out-for-delivery": "out_for_delivery",
  completed: "delivered",
  cancelled: "cancelled",
  refunded: "refunded",
  failed: "failed",
};

/** Statuses that are not orders to the customer (checkout drafts, trash). */
const HIDDEN = new Set(["checkout-draft", "trash", "auto-draft"]);

export const isListedWooStatus = (status: string): boolean => !HIDDEN.has(status);

/** Unknown statuses (one the owner adds later) read as placed, never as an error. */
export const toOrderStatus = (status: string): OrderStatus => STATUSES[status] ?? "placed";

const PAYMENTS: Record<string, OrderPayment> = { cod: "cod", paymob: "card", "paymob-main": "card" };

export const toOrderPayment = (gateway: string): OrderPayment => PAYMENTS[gateway] ?? "other";
