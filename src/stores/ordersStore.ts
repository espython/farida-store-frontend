
import { makeAutoObservable, runInAction } from "mobx";
import { OrderDetail } from "./specificTypes/orderAddressType";
import { OrderDetails, OrderItems } from "./specificTypes/orderItemsType";
import { UserOrderDetails } from "./specificTypes/userOrderDetailsType";
import { STRAPI_ENDPOINT } from "@/api/config";

export class OrdersStore {
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
      let data: { order_details?: UserOrderDetails[] } = await response.json();

      runInAction(() => {
        // /users/me is NOT a standard content-type route. It is a custom
        // users-permissions handler that sets ctx.body to the entity-service
        // result after sanitize.contentAPI.output, and never passes through the
        // core-api transformResponse that wraps every other route in
        // { data: { id, attributes } }. So the user and its populated
        // relations arrive flat, inlined, with no envelope at any depth --
        // which is why cartStore reads data.cart.cart_items directly.
        // Only routes served by the core-api controllers, such as
        // /order-details/:id in getOrderDetails above, are enveloped.
        // Array.isArray, not `?? []`: a non-array would otherwise be stored
        // against the declared UserOrderDetails[] and break .length/.map.
        this.userOrders = Array.isArray(data?.order_details)
          ? data.order_details
          : [];
      });

      return true;
    } else {
      return false;
    }
  };

  set setIsAddressLoading(val: boolean) {
    this.isAddressLoading = val;
  }
}
