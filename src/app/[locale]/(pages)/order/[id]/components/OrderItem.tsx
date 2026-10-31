"use client";
import { Image } from "@nextui-org/react";
import { Link } from "@/navigation";
import React from "react";
import { useTranslations } from "next-intl";
import { formatAmount } from "@/shared/lib/price";

interface orderItemProps {
  id: string | number;
  imgsrc: string;
  title: string;
  price: number;
  quantity: number;
}

/** One ordered product: thumbnail, title (links to the product), unit × qty and line total. */
const OrderItem = ({ id, imgsrc, title, price, quantity }: orderItemProps) => {
  const currency = useTranslations("currency");
  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] md:grid-cols-[5rem_1fr_auto] gap-3 md:gap-4 items-center">
      <div className="aspect-square rounded-xl overflow-hidden bg-sand">
        <Image
          radius="none"
          removeWrapper
          src={`${process.env.NEXT_PUBLIC_HOST}${imgsrc}`}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <Link
          href={`/product/${id}`}
          className="font-semibold leading-snug line-clamp-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-garden rounded"
        >
          {title}
        </Link>
        <p className="text-sm text-garden-muted" dir="ltr">
          {formatAmount(price)} × {quantity}
        </p>
      </div>
      <p className="font-bold whitespace-nowrap">
        {formatAmount(price * quantity)} <span className="text-sm">{currency("currency")}</span>
      </p>
    </div>
  );
};

export default OrderItem;
