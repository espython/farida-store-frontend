"use client";
import { Image, Skeleton } from "@nextui-org/react";
// import NextImage from 'next/image'
import { Link } from "@/navigation";
import React from "react";
import { useTranslations } from "next-intl";
import { formatAmount } from "@/shared/lib/price";

interface bestProductProps {
  id: string;
  imageUrl: string;
  title: string;
  price: number;
  prePrice: number;
}

const BestProduct = ({
  id,
  title = "",
  imageUrl = "",
  price = 0,
  prePrice = 0,
}: bestProductProps) => {
  const currency = useTranslations("currency");
  // `prePrice` is the price after discount (0 when there is none): it is the price paid now.
  const onSale = prePrice > 0 && prePrice < price;
  return (
    <article className="flex flex-col gap-3">
      <Skeleton isLoaded={imageUrl.length > 0} className="rounded-[20px]">
        <Link href={`/product/${id}`} className="block aspect-square rounded-[20px] overflow-hidden bg-sand" tabIndex={-1} aria-hidden="true">
          <Image src={imageUrl} alt="" radius="none" removeWrapper className="w-full h-full object-cover" />
        </Link>
      </Skeleton>
      <Skeleton isLoaded={title.length > 0} className="rounded-lg">
        <h3 className="font-semibold leading-snug line-clamp-2 min-h-[2.75em]">
          <Link href={`/product/${id}`} className="hover:text-saffron-ink">
            {title}
          </Link>
        </h3>
      </Skeleton>
      <Skeleton isLoaded={price > 0} className="rounded-lg">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold">
            {formatAmount(onSale ? prePrice : price)} <span className="text-sm font-semibold">{currency("currency")}</span>
          </span>
          {onSale && <span className="text-sm text-garden-muted line-through">{formatAmount(price)}</span>}
        </p>
      </Skeleton>
    </article>
  );
};

export default BestProduct;
