export interface UserOrderDetails {
  id: number;
  attributes: {
    total: number;
    createdAt: Date;
    updatedAt: Date;
    order_notes: string;
    arrivedAt: Date;
    user: { data: { id: number; attributes: Main } };
    status: "delivery" | "placed" | "arrived";
    /** Populated oneToMany, so a v4 collection wrapper - not a bare array. */
    order_items: { data: OrderItem[] };
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
  };
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
  order_details?: { data: UserOrderDetails[] };
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
