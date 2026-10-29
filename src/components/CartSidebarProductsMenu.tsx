"use client";
import React, { useContext, useEffect, useState } from "react";
import CartSidebarProduct from "./CartSidebarProduct";
import { Divider } from "@nextui-org/react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import Cookies from "js-cookie";
import { useAuth } from "@/hooks/useAuth";

const CartSidebarProductsMenu = () => {
  const { cart, user, loginForm, registerForm, cartSidebar } =
    useContext(StoreContext);
  const { isLoggedIn, isLoading } = useAuth();
  const [uiCondition, setUiCondition] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setUiCondition(isLoggedIn);
    }
  }, [
    isLoggedIn,
    isLoading,
    user.isLoading,
    loginForm.isLoading,
    registerForm.isLoading,
    user.isMergingOrRemovingLoading,
  ]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 p-5 overflow-auto w-full">
      {uiCondition
        ? cart.userCartItems.map((product) => (
            <div key={product.id} className="flex flex-col gap-3">
              <CartSidebarProduct product={product} />

              <Divider className="bg-line" />
            </div>
          ))
        : cart.cartProducts.map((product) => (
            <div key={product.id} className="flex flex-col gap-3">
              <CartSidebarProduct
                product={{ ...product, cartItemId: product.id }}
              />

              <Divider className="bg-line" />
            </div>
          ))}
    </div>
  );
};

export default observer(CartSidebarProductsMenu);
