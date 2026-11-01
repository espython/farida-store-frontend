import type { Money } from "@/shared/kernel/Money";

/**
 * Where an order is, in the shop's words. Woo's statuses map onto these
 * (infrastructure/statusMapper); "out for delivery" is a custom status the
 * shop's WordPress registers.
 */
export type OrderStatus =
  | "awaiting_payment"
  | "placed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "failed";

export type OrderPayment = "cod" | "card" | "other";

export interface OrderTotals {
  items: Money;
  shipping: Money;
  discount: Money;
  total: Money;
}

export interface OrderLine {
  productId: string;
  title: string;
  quantity: number;
  /** Before coupons, so the lines add up to `totals.items`. */
  total: Money;
  image: string | null;
  /** For the product link; null when the product is gone. */
  slug: string | null;
}

export interface DeliveryAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  /** Governorate code (shared/kernel/Governorate). */
  state: string;
  postcode: string;
  phone: string;
}

/** One row of the customer's order list. */
export interface OrderSummary {
  id: string;
  status: OrderStatus;
  createdAt: string;
  itemCount: number;
  total: Money;
}

/** A whole order, read back from Woo. */
export interface Order extends OrderSummary {
  payment: OrderPayment;
  /** When it was delivered (Woo's completion date), if it was. */
  deliveredAt: string | null;
  lines: OrderLine[];
  address: DeliveryAddress;
  note: string;
  totals: OrderTotals;
}

export interface OrderPage {
  orders: OrderSummary[];
  page: number;
  totalPages: number;
  total: number;
}

export const ORDERS_PER_PAGE = 10;

/** The delivery steps the tracking page shows, in order. */
export const TRACKING_STEPS = ["placed", "out_for_delivery", "delivered"] as const;
export type TrackingStep = (typeof TRACKING_STEPS)[number];
export type StepState = "done" | "current" | "upcoming";

/**
 * Each step's state for an order on its way, or null when the order left
 * the delivery flow (cancelled, refunded, failed, still awaiting payment):
 * the page shows the status instead of a timeline.
 */
export const trackingOf = (status: OrderStatus): { step: TrackingStep; state: StepState }[] | null => {
  const reached = (TRACKING_STEPS as readonly string[]).indexOf(status);
  if (reached < 0) return null;
  return TRACKING_STEPS.map((step, i) => ({
    step,
    state: i < reached || status === "delivered" ? "done" : i === reached ? "current" : "upcoming",
  }));
};

/** Still on its way to the customer. */
export const isInProgress = (status: OrderStatus): boolean => status === "placed" || status === "out_for_delivery";

/** Order numbers are Woo ids: positive integers. */
export const isOrderNumber = (value: string): boolean => /^[1-9]\d{0,11}$/.test(value);

/** What a customer types ("#298", " 298 ") → the number, or null. */
export const parseOrderNumber = (input: string): string | null => {
  const n = input.trim().replace(/^#\s*/, "");
  return isOrderNumber(n) ? n : null;
};
