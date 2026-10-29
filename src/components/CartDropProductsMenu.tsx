"use client";
import React, { useContext, useEffect, useState } from "react";
import CartDropProduct from "./CartDropProduct";
import { StoreContext } from "@/contexts/StoreContext";
import { Divider } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { useAuth } from "@/hooks/useAuth";

const CartDropProductsMenu = () => {
  const { cart, user, loginForm, registerForm } = useContext(StoreContext);
  const { isLoggedIn, isLoading } = useAuth();
  const [uiCondition, setUiCondition] = useState(false); // Default to false

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
    <div
      className={`w-full flex flex-col gap-3 h-auto ${
        user.isMergingOrRemovingLoading ? "max-h-[35vh]" : "max-h-[45vh]"
      } overflow-auto`}
    >
      {uiCondition
        ? cart.userCartItems.map((product) => (
            <div key={product.id} className="flex flex-col gap-3">
              <CartDropProduct product={product} />
              <Divider className="bg-line" />
            </div>
          ))
        : cart.cartProducts.map((product) => (
            <div key={product.id} className="flex flex-col gap-3">
              <CartDropProduct
                product={{ ...product, cartItemId: product.id }}
              />
              <Divider className="bg-line" />
            </div>
          ))}
    </div>
  );
};

export default observer(CartDropProductsMenu);
