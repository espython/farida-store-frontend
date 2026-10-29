"use client";
import React, { useContext, useEffect } from "react";
import BestProduct from "./BestProduct";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useLocale } from "next-intl";

const BestSellerMenu = () => {
  // const products: number[] = [1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1]

  const { products } = useContext(StoreContext);

  const locale = useLocale();

  useEffect(() => {
    products.getBestSellerProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-6">
      {products.bestSellerProducts.slice(0, 4).map((p) => (
        <li key={p.id}>
          <BestProduct
            id={`${p.id}`}
            imageUrl={`${process.env.NEXT_PUBLIC_HOST}${p.attributes?.thumbnail?.data.attributes.url}`}
            title={
              locale === "en"
                ? p.attributes.title
                : p.attributes?.localizations?.data[0].attributes.title
            }
            price={p.attributes.price}
            prePrice={
              products.getPriceAfterDiscount(
                p.attributes.discount.data,
                p.attributes.price
              ) ?? 0
            }
          />
        </li>
      ))}
    </ul>
  );
};

export default observer(BestSellerMenu);
