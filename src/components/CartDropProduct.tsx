/* eslint-disable @next/next/no-img-element */
"use client";

import { StoreContext } from "@/contexts/StoreContext";
import { cartProductType } from "@/stores/specificTypes/cartProductType";

import { Image } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useState } from "react";
import { CgClose } from "react-icons/cg";
import LoadingOverlay from "./LoadingOverlay";
import { isUserLoggedIn } from "@/functions/credentials";
import { userCartProductType } from "@/stores/specificTypes/userCartProductType";
import { useLocale, useTranslations } from "next-intl";
import QuantityStepper from "@/shared/ui/QuantityStepper";
import { formatAmount } from "@/shared/lib/price";

interface cartDropProductProps {
  product: userCartProductType;
}

const CartDropProduct = ({ product }: cartDropProductProps) => {
  const [counter, setCounter] = useState(product.quantity);
  const [isLoading, setIsLoading] = useState(false);
  const locale = useLocale();
  const currency = useTranslations("currency");
  const t = useTranslations("cartDrop");

  const { cart, user } = useContext(StoreContext);

  const increase = () => {
    setCounter((c) => Number(c) + 1);

    if (isUserLoggedIn()) {
      setIsLoading(true);
      user
        .updateUserCartProductQuantity(product.cartItemId, Number(counter) + 1)
        .then(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(true);
      cart.changeQuantity(product.id, Number(counter) + 1);
      setIsLoading(false);
    }

    cart.setProductsCount = cart.productsCount + 1;
  };

  const decrease = () => {
    if (counter > 1) {
      setCounter((c) => c - 1);
      if (isUserLoggedIn()) {
        setIsLoading(true);
        user
          .updateUserCartProductQuantity(product.cartItemId, counter - 1)
          .then(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(true);
        cart.changeQuantity(product.id, counter - 1);
        setIsLoading(false);
      }
    } else {
      return;
    }

    cart.setProductsCount = cart.productsCount + 1;
  };

  const deleteItem = () => {
    if (isUserLoggedIn()) {
      setIsLoading(true);
      user.removeProductFromUserCart(product.cartItemId).then(() => {
        setIsLoading(false);
        cart.setProductsCount = cart.productsCount - 1;
      });
    } else {
      setIsLoading(true);
      cart.deleteProduct(product.id);
      setIsLoading(false);
      cart.setProductsCount = cart.productsCount - 1;
    }
  };

  useEffect(() => {
    setCounter(product.quantity);
  }, [product.quantity]);

  const title = locale === "en" ? product.title : product.localizatons.title;

  return (
    <div className="relative">
      {isLoading && <LoadingOverlay />}
      <div className="grid grid-cols-[4.5rem_1fr] gap-3">
        <div className="w-[4.5rem] aspect-square rounded-xl overflow-hidden bg-sand">
          <img src={product.imgSrc} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-start gap-2">
            <p className="flex-1 font-semibold leading-snug line-clamp-2">{title}</p>
            <button
              type="button"
              onClick={deleteItem}
              aria-label={`${t("remove")} ${title}`}
              className="-mt-2 -me-2 w-9 h-9 shrink-0 grid place-items-center rounded-full hover:bg-sand"
            >
              <CgClose className="text-lg" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <QuantityStepper size="sm" value={counter} onIncrement={increase} onDecrement={decrease} />
            <p className="font-bold">
              {formatAmount(product.price)} <span className="text-sm">{currency("currency")}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(CartDropProduct);
