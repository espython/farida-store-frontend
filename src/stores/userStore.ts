"use client";
import { makeAutoObservable, runInAction } from "mobx";
import { Userdata } from "./specificTypes/userdata";
import { cartProductType } from "./specificTypes/cartProductType";
import { userCartProductType } from "./specificTypes/userCartProductType";
import { STRAPI_ENDPOINT } from "@/api/config";

export class userStore {
  strapiUserdata: Userdata = {} as Userdata;
  isLoading: boolean = false;
  isMergingOrRemovingLoading: boolean = false;
  userReviewRating: number = 0;
  userReviewDescription: string = "";
  userReviewLoading: boolean = false;
  userReviewSended: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  // The signed-in customer now comes from WordPress (useSession in
  // modules/customer). strapiUserdata stays empty; the profile, addresses,
  // orders and checkout pages already read Woo.

  // user products methods

  addProductToUserCart = async (
    productId: string | number,
    quantity: number
  ) => {
    const response = await fetch(
      `${STRAPI_ENDPOINT}/cart-items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            product: productId.toString(),
            quantity: quantity,
            cart: String(this.strapiUserdata?.cart?.id),
          },
        }),
      }
    );
    return response.ok;
  };

  removeProductFromUserCart = async (cartItemId: number | string) => {
    const response = await fetch(
      `${STRAPI_ENDPOINT}/cart-items/${cartItemId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.ok;
  };

  updateUserCartProductQuantity = async (
    cartItemId: number | string,

    newQuantity: number
  ) => {
    return await fetch(
      `${STRAPI_ENDPOINT}/cart-items/${cartItemId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            quantity: newQuantity,
          },
        }),
      }
    );
  };

  mergeLocalCartWithUserCart = async (userCartItems: userCartProductType[]) => {
    if (typeof window === "undefined") return false;

    const localCartItems: cartProductType[] = JSON.parse(
      sessionStorage.getItem("cart") ?? "[]"
    );

    for (const product of localCartItems) {
      const founded = userCartItems.find((userItem) => {
        return userItem.id === product.id;
      });

      if (!founded) {
        await this.addProductToUserCart(product.id, product.quantity);
      }
    }

    sessionStorage.removeItem("cart");

    return true;
  };

  clearLocalCart = async () => {
    if (typeof window === "undefined") return false;

    sessionStorage.removeItem("cart");

    return true;
  };

  clearUserCart = async (userCartItems: userCartProductType[]) => {
    for (const product of userCartItems) {
      await this.removeProductFromUserCart(product.cartItemId);
    }
  };

  addReviewToProduct = async (productId: string | number) => {
    runInAction(() => {
      this.userReviewSended = false;
      this.userReviewLoading = true;
    });
    const response = await fetch(
      `${STRAPI_ENDPOINT}/reviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            description: this.userReviewDescription,
            rating: this.userReviewRating,
            product: productId,
            user: this.strapiUserdata.id,
          },
        }),
      }
    );

    if (response.ok) {
      runInAction(() => {
        this.userReviewSended = true;
        this.userReviewLoading = false;
      });
    }
    return response.ok;
  };

  resetAllAddReviewSectionStates() {
    this.userReviewDescription = "";
    this.userReviewRating = 0;
  }


  // setting states of the class

  set setIsMergingOrRemovingLoading(val: boolean) {
    this.isMergingOrRemovingLoading = val;
  }

  set setUserReviewDescription(val: string) {
    this.userReviewDescription = val;
  }

  set setUserReviewRating(val: number) {
    this.userReviewRating = val;
  }
}
