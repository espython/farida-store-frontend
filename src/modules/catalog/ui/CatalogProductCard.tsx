"use client";
import type { ReactNode } from "react";
import { Image } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import Rating from "@/components/Rating";
import { Money } from "@/shared/kernel/Money";
import type { Product } from "../domain/Product";
import { discountPercent } from "../domain/pricing";

interface Props {
  product: Product;
  /** Row layout for the list view. */
  row?: boolean;
  /** Cart and wishlist controls are injected by the cart module; none until it exists. */
  actions?: ReactNode;
}

const money = (m: Money) => Money.toDecimal(m);

const CatalogProductCard = ({ product, row = false, actions }: Props) => {
  const locale = useLocale();
  const t = useTranslations("product");
  const currency = useTranslations("currency");
  const pct = discountPercent(product);
  const image = product.images[0];
  const left = product.stock.status === "low" ? product.stock.quantity : null;

  return (
    <div
      className="flex p-3 lmob:px-2 md:px-10 lg:p-0 w-full shadow-sm"
      dir={locale === "en" ? "ltr" : "rtl"}
      data-testid="catalog-product-card"
    >
      <div className={`relative flex w-full ${row ? "flex-row gap-4" : "flex-col"}`}>
        <div
          className={`flex flex-col gap-1 absolute top-2 z-10 ${
            locale === "en" ? "left-2" : "right-2"
          }`}
        >
          {pct > 0 && (
            <span className="px-3 rounded-md text-white bg-red-700 text-sm">
              {t("sale")} -{pct}%
            </span>
          )}
          {product.stock.status === "out_of_stock" && (
            <span className="px-3 rounded-md text-white bg-gray-500 text-sm">
              {t("outOfStock")}
            </span>
          )}
        </div>
        <Link
          href={`/product/${product.slug}`}
          className={`grid place-items-center overflow-hidden ${row ? "w-1/3" : "w-full"}`}
        >
          <Image
            src={image?.src ?? ""}
            radius="sm"
            alt={image?.alt || product.title}
            className="w-full aspect-square grid place-items-center overflow-hidden"
            classNames={{ img: "w-full h-full object-contain justify-self-center" }}
          />
        </Link>
        <div className="p-2 flex flex-col gap-2 flex-1">
          <h2 className="text-sm md:text-xl line-clamp-1">{product.title}</h2>
          <div className="flex items-center gap-2">
            <Rating rating={product.rating.average} size="1rem" />
            <span className="text-mainBlack/50 text-sm">({product.rating.count})</span>
          </div>
          <div className="flex items-center gap-5">
            {product.regularPrice && (
              <span className="text-sm md:text-xl text-mainBlack/30 font-bold line-through">
                {money(product.regularPrice)}
                <span className="text-sm ltr:ml-1 rtl:mr-1">{currency("currency")}</span>
              </span>
            )}
            <span className="text-sm md:text-xl text-mainBlack/70 font-bold">
              {money(product.price)}
              <span className="text-sm ltr:ml-1 rtl:mr-1">{currency("currency")}</span>
            </span>
          </div>
          {left !== null && (
            <span className="text-sm text-amber-700">{t("onlyLeft")}: {left}</span>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
};

export default CatalogProductCard;
