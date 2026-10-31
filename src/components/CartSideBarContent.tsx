"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { Button, Divider } from "@nextui-org/react";
import React, { useContext, useEffect } from "react";

import CartSidebarEmptyCart from "./CartSidebarEmptyCart";
import CartSidebarHeader from "./CartSidebarHeader";
import CartSidebarFooter from "./CartSidebarFooter";
import CartSidebarProductsMenu from "./CartSidebarProductsMenu";
import { observer } from "mobx-react-lite";
import Cookies from "js-cookie";
import { isUserLoggedIn } from "@/functions/credentials";
import ConfirmMergeCart from "./ConfirmMergeCart";
import LoadingOverlay from "./LoadingOverlay";

const CartSideBarContent = () => {
  const { cartSidebar, cart, user, loginForm, registerForm, userOrders } =
    useContext(StoreContext);

  useEffect(() => {
    cart.getAllCartItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user.isLoading,
    loginForm.isLoading,
    registerForm.isLoading,
    cart.productsCount,
    user.isMergingOrRemovingLoading,
    userOrders.isCreatingOrderLoading,
  ]);

  return (
    <div className="relative flex flex-col h-full">
      {user.isMergingOrRemovingLoading && <LoadingOverlay />}
      <CartSidebarHeader close={cartSidebar.hideWholeCartSidebar} />

      {cart.productsCount === 0 ? (
        <CartSidebarEmptyCart />
      ) : (
        <CartSidebarProductsMenu />
      )}

      <CartSidebarFooter />
    </div>
  );
};

export default observer(CartSideBarContent);
