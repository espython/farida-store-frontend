"use client";
import React, { useContext, useState } from "react";
import CartProductCard from "./CartProductCard";
import { userCartProductType } from "@/stores/specificTypes/userCartProductType";
import QuantityCounter from "./QuantityCounter";
import { MdDelete } from "react-icons/md";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useLocale, useTranslations } from "next-intl";
import { formatAmount } from "@/shared/lib/price";

interface cartTableProductProps {
  product: userCartProductType;
}

const CartTableProduct = ({ product }: cartTableProductProps) => {
  const { user, cart } = useContext(StoreContext);
  const [isLoading, setIsloading] = useState(false);

  const locale = useLocale();
  const currency = useTranslations("currency");
  const drop = useTranslations("cartDrop");

  const remove = () => {
    setIsloading(true);
    user.removeProductFromUserCart(product.cartItemId).then(() => {
      cart.setProductsCount = cart.productsCount - 1;
      setIsloading(false);
    });
  };
  const title = locale === "en" ? product.title : product.localizatons.title;

  return (
    <div className="relative py-4">
      {isLoading && <LoadingOverlay />}
      <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_8rem_7rem_2.75rem] gap-x-4 gap-y-3 items-center">
        <CartProductCard
          id={product.id}
          imageUrl={product.imgSrc}
          title={title}
          unitPrice={`${formatAmount(product.price)} ${currency("currency")}`}
        />
        <button
          type="button"
          onClick={remove}
          aria-label={`${drop("remove")} ${title}`}
          className="md:order-last justify-self-end w-11 h-11 grid place-items-center rounded-full text-[#b42318] hover:bg-sand"
        >
          <MdDelete className="text-xl" aria-hidden="true" />
        </button>
        <div className="md:justify-self-center">
          <QuantityCounter settingLoading={setIsloading} product={product} />
        </div>
        <p className="justify-self-end font-bold">
          {formatAmount(Number(product.price) * Number(product.quantity))}{" "}
          <span className="text-sm font-semibold">{currency("currency")}</span>
        </p>
      </div>
    </div>
  );
};

export default observer(CartTableProduct);
