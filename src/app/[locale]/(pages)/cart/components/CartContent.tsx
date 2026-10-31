"use client";
import React, { useContext } from "react";
import TotalPrice from "./TotalPrice";
import CartFooter from "./CartFooter";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";

import ProductsTable2 from "./ProductsTable2";
import ConfirmMergeCart from "@/components/ConfirmMergeCart";
import { useAuth } from "@/hooks/useAuth";

const CartContent = () => {
  const { cartSidebar, user } = useContext(StoreContext);
  const { isLoggedIn } = useAuth();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      <div className="lg:col-span-8 flex flex-col gap-4">
        <ProductsTable2 />
        <CartFooter />
      </div>
      <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
        <TotalPrice />
        {isLoggedIn &&
          cartSidebar.isLocalCartHasItems &&
          !user.isMergingOrRemovingLoading && <ConfirmMergeCart />}
      </div>
    </div>
  );
};

export default observer(CartContent);
