"use client";
import LoadingOverlay from "@/components/LoadingOverlay";
import { Divider, Image, TableCell, TableRow } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import NextImage from "next/image";
import { Link } from "@/navigation";
import React from "react";

interface CartProductProps {
  id: number;
  imageUrl?: string;
  title?: string;
  /** Unit price, already formatted with currency. */
  unitPrice?: string;
  isLoading?: boolean;
}

const CartProductCard = ({
  id,
  title,
  imageUrl,
  unitPrice,
  isLoading,
}: CartProductProps) => {
  return (
    <div className="relative grid grid-cols-[5rem_1fr] md:grid-cols-[6rem_1fr] gap-4 items-center min-w-0">
      {isLoading && <LoadingOverlay />}
      <Link href={`/product/${id}`} className="aspect-square rounded-2xl overflow-hidden bg-sand" tabIndex={-1} aria-hidden="true">
        <Image src={imageUrl} alt="" radius="none" removeWrapper className="w-full h-full object-cover" />
      </Link>
      <div className="flex flex-col gap-1 min-w-0">
        <Link href={`/product/${id}`} className="font-semibold leading-snug line-clamp-2 hover:text-saffron-ink">
          {title}
        </Link>
        {unitPrice && <p className="text-sm text-garden-muted">{unitPrice}</p>}
      </div>
    </div>
  );
};

export default observer(CartProductCard);
