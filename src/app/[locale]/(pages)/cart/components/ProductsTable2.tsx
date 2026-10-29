"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import CartTableProduct from "./CartTableProduct";
import CartTableHeader from "./CartTableHeader";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useAuth } from "@/hooks/useAuth";

const ProductsTable2 = () => {
  const { cart, user } = useContext(StoreContext);
  const { isLoggedIn } = useAuth();

  return (
    <div className="relative bg-white rounded-3xl px-4 md:px-6">
      <CartTableHeader />
      <ul className="divide-y divide-line">
        {isLoggedIn
          ? cart.userCartItems.map((item) => (
              <li key={item.id}>
                <CartTableProduct product={item} />
              </li>
            ))
          : cart.cartProducts.map((item) => (
              <li key={item.id}>
                <CartTableProduct product={{ ...item, cartItemId: item.id }} />
              </li>
            ))}
      </ul>
      {user.isMergingOrRemovingLoading && <LoadingOverlay />}
    </div>
  );
};

export default observer(ProductsTable2);
