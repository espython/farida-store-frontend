"use client";
import { formatAmount } from "@/shared/lib/price";
import { StoreContext } from "@/contexts/StoreContext";
import { strapiProductType } from "@/stores/specificTypes/strapiProductType";
import { Image } from "@nextui-org/react";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { useRouter } from "@/navigation";
import React, { useContext } from "react";

interface miniSearchProductProps {
  product: strapiProductType;
}

const MiniSearchProduct = ({ product }: miniSearchProductProps) => {
  const { searchBox, products } = useContext(StoreContext);

  const router = useRouter();
  const locale = useLocale();

  const handleAllSearchingBoxProcesses = () => {
    router.push(`/product/${product.id}`);
    searchBox.hideWholeSearchBox();
    searchBox.setSearchInputValue("");
  };

  const getPriceAfterDiscount = () => {
    return products.getPriceAfterDiscount(
      product.attributes.discount.data,
      product.attributes.price
    );
  };

  return (
    <div
      className="grid grid-cols-[4.5rem_1fr] gap-4 items-center p-2 rounded-2xl bg-white hover:bg-sand transition-colors cursor-pointer"
      onClick={handleAllSearchingBoxProcesses}
    >
      <div className="w-[4.5rem] aspect-square rounded-xl overflow-hidden bg-sand">
        <Image
          src={`${process.env.NEXT_PUBLIC_HOST}${product.attributes?.thumbnail?.data.attributes.url}`}
          alt=""
          radius="none"
          removeWrapper
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div
          className="cursor-pointer"
          onClick={handleAllSearchingBoxProcesses}
        >
          <p className="font-semibold line-clamp-1">
            {locale === "en"
              ? product.attributes.title
              : product.attributes?.localizations?.data[0].attributes.title}
          </p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold">
            {formatAmount(getPriceAfterDiscount() || product.attributes?.price)} <span className="text-sm">EGP</span>
          </span>
          {getPriceAfterDiscount() && (
            <span className="text-sm text-garden-muted line-through">{formatAmount(product.attributes?.price)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniSearchProduct;
