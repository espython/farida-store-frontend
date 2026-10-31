"use client";
import { formatAmount } from "@/shared/lib/price";
import { Image } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import React from "react";

interface orderedItemProps {
  title: string;
  price: number;
  quantity: number;
  imgSrc: string;
}

const OrderedItem = ({ title, price, imgSrc, quantity }: orderedItemProps) => {
  const currency = useTranslations("currency");

  return (
    <div className="grid grid-cols-[4rem_1fr_auto] gap-3 items-center">
      <div className="w-16 aspect-square rounded-xl overflow-hidden bg-sand">
        <Image radius="none" removeWrapper src={imgSrc} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold leading-snug line-clamp-2">{title}</p>
        <p className="text-sm text-garden-muted" dir="ltr">
          {formatAmount(price)} × {quantity}
        </p>
      </div>
      <p className="font-bold">
        {formatAmount(price * quantity)} <span className="text-sm">{currency("currency")}</span>
      </p>
    </div>
  );
};

export default observer(OrderedItem);
