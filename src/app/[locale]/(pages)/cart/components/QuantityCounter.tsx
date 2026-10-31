"use client";
import QuantityStepper from "@/shared/ui/QuantityStepper";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StoreContext } from "@/contexts/StoreContext";
import { isUserLoggedIn } from "@/functions/credentials";
import { cartProduct } from "@/stores/generalTypes";
import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useState } from "react";

interface quantityCounterProps {
  product: cartProduct;
  settingLoading: (val: React.SetStateAction<boolean>) => void;
}

const QuantityCounter = ({ product, settingLoading }: quantityCounterProps) => {
  const { cart, user } = useContext(StoreContext);

  const [counter, setCounter] = useState<number>(product.quantity);

  const increase = () => {
    setCounter((c) => Number(c) + 1);

    if (isUserLoggedIn()) {
      if (product.cartItemId === undefined) return;
      settingLoading(true);
      user
        .updateUserCartProductQuantity(product.cartItemId, Number(counter) + 1)
        .then(() => {
          settingLoading(false);
        });
    } else {
      settingLoading(true);
      cart.changeQuantity(product.id, Number(counter) + 1);
      settingLoading(false);
    }

    cart.setProductsCount = cart.productsCount + 1;
  };

  const decrease = () => {
    if (counter > 1) {
      setCounter((c) => c - 1);
      if (isUserLoggedIn()) {
        if (product.cartItemId === undefined) return;
        settingLoading(true);
        user
          .updateUserCartProductQuantity(product.cartItemId, counter - 1)
          .then(() => {
            settingLoading(false);
          });
      } else {
        settingLoading(true);
        cart.changeQuantity(product.id, counter - 1);
        settingLoading(false);
      }
    } else {
      return;
    }

    cart.setProductsCount = cart.productsCount + 1;
  };

  useEffect(() => {
    setCounter(product.quantity);
  }, [product.quantity]);

  return <QuantityStepper value={counter} onIncrement={increase} onDecrement={decrease} />;
};

export default observer(QuantityCounter);
