export interface UserOrderDetails {
  id: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  order_notes: string;
  arrivedAt: Date;
  status: "delivery" | "placed" | "arrived";
  /**
   * Flat, inlined relations: /users/me bypasses the core-api envelope, so
   * this is the shape as it actually arrives, not a { data: [...] } wrapper.
   */
  order_items: OrderItem[];
  /**
   * Denormalised onto the order row in #200. The `user_order_address`
   * relation these replaced no longer exists, so it must not be populated
   * or read.
   */
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  second_phone: string;
  user: Main;
}

export interface Main {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  first_name: string;
  last_name: string;
  order_details?: UserOrderDetails[];
}

export interface OrderItem {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  quantity: number;
}

// export enum Email {
//   Medosara2011GmailCOM = "medosara2011@gmail.com",
// }

// export enum FirstName {
//   Mohammed = "mohammed",
// }

// export enum LastName {
//   Nabil = "nabil",
// }

// export enum Provider {
//   Local = "local",
// }

// export enum Username {
//   Nebo = "nebo",
// }
