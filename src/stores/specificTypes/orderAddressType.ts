export interface OrderDetail {
  data: MainData;
  meta: Meta;
}

export interface MainData {
  id: number;
  attributes: PurpleAttributes;
}

export interface PurpleAttributes {
  total: number;
  createdAt: Date;
  updatedAt: Date;
  order_notes: string;
  arrivedAt: Date;
  state: string;
  status: "delivery" | "placed" | "arrived";
  country: string;
  city: string;
  street: string;
  phone: string;
  second_phone: string;
  postal_code: string;
  /**
   * Server-authoritative payment state. Set at checkout to 'cod' or 'pending'
   * and flipped to 'paid' by the webhook, so it is the only trustworthy source
   * for what the customer was charged and whether it settled.
   */
  payment_status: "pending" | "paid" | "failed" | "cod";
  /** Written by the webhook on settlement. Null until then. */
  payment_transaction_id: string | null;
  /** Paymob order, written at checkout for card orders. Null for COD. */
  paymob_order_id: string | null;
  paid_at: Date | null;
  user: User;
  order_items: OrderItems;
}

export interface OrderItems {
  data: Datum[] | null;
}

export interface Datum {
  id: number;
  attributes: DatumAttributes;
}

export interface DatumAttributes {
  createdAt: Date;
  updatedAt: Date;
  quantity: number;
}

export interface User {
  data: UserData;
}

export interface UserData {
  id: number;
  attributes: FluffyAttributes;
}

export interface FluffyAttributes {
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  first_name: string;
  last_name: string;
}

export interface Meta {}
