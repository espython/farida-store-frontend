/**
 * Derives what the UI may claim about a payment from the order attributes the
 * server returns.
 *
 * The only trustworthy input is `payment_status`, which the server sets to
 * 'cod' or 'pending' at checkout and which only the Paymob webhook flips to
 * 'paid'. Deriving the method or the settlement state from anything else --
 * notably `order_notes`, which is a client-supplied marker string -- lets the
 * page claim a card payment completed when the server has not confirmed it.
 *
 * `payment_transaction_id` and `paymob_order_id` are real columns, written by
 * the webhook and by checkout respectively. They are read directly here rather
 * than scraped out of the notes with a regex, which never matched anything.
 */

export type OrderPaymentStatus = "pending" | "paid" | "failed" | "cod";

export interface OrderPaymentAttributes {
  payment_status?: OrderPaymentStatus | null;
  payment_transaction_id?: string | null;
  paymob_order_id?: string | null;
}

export interface OrderPaymentDisplay {
  /** True when the order was placed cash on delivery. */
  isCod: boolean;
  /** Which method label and icon to show. */
  method: "cod" | "online";
  /** Which status chip to show. */
  status: "completed" | "pending" | "failed" | "unknown";
  transactionId: string | null;
  paymobOrderId: string | null;
}

export function getOrderPaymentDisplay(
  attributes?: OrderPaymentAttributes | null
): OrderPaymentDisplay {
  const paymentStatus = attributes?.payment_status ?? null;
  const isCod = paymentStatus === "cod";

  let status: OrderPaymentDisplay["status"];
  if (isCod) {
    // Nothing settles until the goods arrive, so this is not a failure.
    status = "pending";
  } else if (paymentStatus === "paid") {
    status = "completed";
  } else if (paymentStatus === "failed") {
    status = "failed";
  } else if (paymentStatus === "pending") {
    status = "pending";
  } else {
    // No payment_status at all: older row, or a response we could not read.
    // Say so rather than implying a successful card payment.
    status = "unknown";
  }

  return {
    isCod,
    method: isCod ? "cod" : "online",
    status,
    // The server never sets either for COD, but keep that explicit so a
    // stray value cannot put card transaction details on a COD order.
    transactionId: isCod
      ? null
      : attributes?.payment_transaction_id || null,
    paymobOrderId: isCod ? null : attributes?.paymob_order_id || null,
  };
}
