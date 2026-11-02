import type { Order } from "./Order";

/**
 * A customer may cancel an order the shop has not sent out yet and that holds
 * no card payment: waiting for payment, payment failed, or cash on delivery
 * still being prepared. A paid card order needs a refund, so the customer asks
 * the shop instead. Woo restores the stock when the order is cancelled (once,
 * even if it is cancelled twice).
 */
export const canCancel = (order: Pick<Order, "status" | "payment">): boolean =>
  order.status === "awaiting_payment" ||
  order.status === "failed" ||
  (order.status === "placed" && order.payment === "cod");
