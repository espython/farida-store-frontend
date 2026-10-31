"use client";
import React from "react";
import { CartLineItem, useCart } from "@/modules/cart";
import TotalPrice from "./TotalPrice";
import CartFooter from "./CartFooter";

const CartContent = () => {
  const { lines } = useCart();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      <div className="lg:col-span-8 flex flex-col gap-4">
        <ul className="bg-white rounded-3xl px-4 md:px-6 divide-y divide-line">
          {lines.map((line) => (
            <li key={line.product.id} className="py-4">
              <CartLineItem line={line} />
            </li>
          ))}
        </ul>
        <CartFooter />
      </div>
      <div className="lg:col-span-4 lg:sticky lg:top-24">
        <TotalPrice />
      </div>
    </div>
  );
};

export default CartContent;
