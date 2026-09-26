
import { makeAutoObservable, runInAction } from "mobx";
import { OrderDetail } from "./specificTypes/orderAddressType";
import { OrderDetails, OrderItems } from "./specificTypes/orderItemsType";
import { UserOrderDetails } from "./specificTypes/userOrderDetailsType";
import { STRAPI_ENDPOINT } from "@/api/config";

export class OrdersStore {
  isCreatingOrderLoading: boolean = false;

  orderDetails: OrderDetail = {} as OrderDetail;
  orderItems: OrderItems = {} as OrderItems;
  userOrders: UserOrderDetails[] = [];
  isAddressLoading: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  addNewUserAddress = async (userAddressData: {
    street: string;
    state: string;
    city: string;
    country: string;
    postal_code: string;
    phone: string;
    userId: string;
    second_phone: string;
    fullname: string;
  }) => {
    const response = await fetch(
      `${STRAPI_ENDPOINT}/user-addresses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            street: userAddressData.street,
            state: userAddressData.state,
            city: userAddressData.city,
            country: userAddressData.country,
            postal_code: userAddressData.postal_code,
            phone: userAddressData.phone,
            user: userAddressData.userId,
            second_phone: userAddressData.second_phone,
            fullname: userAddressData.fullname,
          },
        }),
      }
    );
    if (response.ok) {
      let data = await response.json();

      return data;
    } else {
      return null;
    }
  };

  addNewUserPaymentMethod = async () => {};

  // Persist the shipping address server-side (owner-scoped). Only the
  // returned record id is kept client-side; personal data stays on the server.
  saveUserAddress = async (data: {
    street: string;
    state: string;
    city: string;
    country: string;
    postal_code: string;
    phone: string;
    second_phone: string;
    userId: string;
  }) => {
    const response = await fetch(`${STRAPI_ENDPOINT}/user-addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          street: data.street,
          state: data.state,
          city: data.city,
          country: data.country,
          postal_code: data.postal_code,
          phone: data.phone,
          second_phone: data.second_phone,
          user: data.userId,
        },
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  };

  // Server-owned checkout: the backend derives the user from the JWT,
  // recomputes prices and totals from the database and writes the order
  // with its items atomically. The client only sends product ids and
  // quantities plus a reference to a server-stored address — never
  // totalPrice, userId or personal shipping data. A server-created Paymob
  // order/payment key comes back for paymentMethod "card".
  checkout = async (data: {
    items: Array<{ id: number | string; quantity: number }>;
    addressId: number | string;
    orderNotes: string;
    paymentMethod?: "card" | "cod";
    idempotencyKey?: string;
  }) => {
    let response = await fetch(`${STRAPI_ENDPOINT}/order-details/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      let responseData = await response.json();
      return responseData;
    } else {
      return null;
    }
  };

  getOrderDetails = async (orderId: number | string) => {
    let response = await fetch(
      `${STRAPI_ENDPOINT}/order-details/${orderId}?populate=*`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      let data: OrderDetail = await response.json();

      runInAction(() => {
        this.orderDetails = data;
      });

      return data;
    } else {
      return null;
    }
  };

  // getOrderDetailsAddress = async (orderId: number | string) => {
  //   let data = await this.getOrderDetails(orderId);

  //   return data?.data.attributes.user_order_address;
  // };

  getAllOrderItems = async (orderId: number | string) => {
    let response = await fetch(
      `${STRAPI_ENDPOINT}/order-details/${orderId}?[populate][order_items][populate][product][populate]=*`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      let data: OrderDetails = await response.json();

      runInAction(() => {
        if (data.data.attributes.order_items) {
          this.orderItems = data.data.attributes.order_items;
        }
      });

      return response.ok;
    } else {
      return null;
    }
  };

  isOrderInUserOrdersList = async (
    orderId: string | number,
    userId: string | number
  ) => {
    let response = await fetch(
      `${STRAPI_ENDPOINT}/order-details/${orderId}?populate=*`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      let data = await response.json();

      if (data) {
        if (data?.data?.attributes?.user?.data?.id == userId) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  };

  getUserOrders = async () => {
    let response = await fetch(
      `${STRAPI_ENDPOINT}/users/me?[populate][order_details][populate][order_items][populate]=*`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      let data: {
        data?: { attributes?: { order_details?: { data?: UserOrderDetails[] } } };
      } = await response.json();

      runInAction(() => {
        // /users/me is a *single* type, so a populated relation arrives under
        // data.attributes as a v4 collection: data[].attributes, each entry an
        // { id, attributes } envelope. It is never at the top level.
        this.userOrders = data?.data?.attributes?.order_details?.data ?? [];
      });

      return true;
    } else {
      return false;
    }
  };

  set setIsCreatingOrderLoading(val: boolean) {
    this.isCreatingOrderLoading = val;
  }

  set setIsAddressLoading(val: boolean) {
    this.isAddressLoading = val;
  }
}
