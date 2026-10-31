import { makeAutoObservable } from "mobx";
import { STRAPI_ENDPOINT } from "@/api/config";

// Only the address book's "add address" is left here (A4 moves it to Woo).
// Orders are read from Woo through modules/orders.
export class OrdersStore {
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

  set setIsAddressLoading(val: boolean) {
    this.isAddressLoading = val;
  }
}
