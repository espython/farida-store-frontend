"use client";
import React from "react";

import ReactStars from "react-rating-star-with-type";
import { FaStar } from "react-icons/fa";
import { FaStarHalfAlt } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import { Skeleton } from "@nextui-org/react";
import Rating from "@/components/Rating";
import { strapiProductType } from "@/stores/specificTypes/strapiProductType";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import Badge from "@/shared/ui/Badge";
import { formatAmount } from "@/shared/lib/price";
import { ProductArabicData } from "@/stores/specificTypes/productArabicDataType";

interface productProps {
  product?: strapiProductType;
  averageRating?: number;
  ratingsLength?: number;
  priceAfterDiscount?: number;
  arabicData?: ProductArabicData;
}

const DetailsSection = ({
  product,
  averageRating,
  ratingsLength,
  priceAfterDiscount,
  arabicData,
}: productProps) => {
  const locale = useLocale();
  const t = useTranslations("productPage");
  const currency = useTranslations("currency");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Skeleton isLoaded={product?.attributes?.title !== ""}>
          <h1 className="font-display text-[1.75rem] md:text-[2.5rem] leading-[1.1] font-medium">
            {product?.attributes?.title !== ""
              ? locale === "en"
                ? product?.attributes?.title
                : product?.attributes?.localizations?.data[0]?.attributes?.title
              : ""}
          </h1>
        </Skeleton>

        <Skeleton
          isLoaded={
            averageRating !== null || averageRating !== undefined ? true : false
          }
        >
          <div className="flex items-center gap-2">
            <Rating rating={averageRating} />
            <h1 className="text-sm text-garden-muted">
              ({ratingsLength})
            </h1>
          </div>
        </Skeleton>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton isLoaded={product?.attributes?.description !== ""}>
          <h2 className="sr-only">{t("details.description")}</h2>

          <p className="text-garden-muted whitespace-pre-line">
            {product?.attributes?.description
              ? locale === "en"
                ? product?.attributes?.description
                : product?.attributes?.localizations?.data[0]?.attributes
                    ?.description
              : ""}
          </p>
        </Skeleton>
      </div>

      <p className="font-semibold capitalize">
        <span className="sr-only">{t("details.status")}: </span>
        {product?.attributes?.product_inventory?.data?.attributes?.available_in_stock != null &&
        product?.attributes?.product_inventory?.data?.attributes?.available_in_stock > 0 ? (
          <span>
            {t("details.inStock")} ({product?.attributes?.product_inventory?.data?.attributes?.available_in_stock} {locale === "ar" ? "قطعة متوفرة" : "items available"})
          </span>
        ) : (
          <span className="text-[#b42318]">{t("details.outStock")}</span>
        )}
      </p>

      <div className="flex flex-col gap-2">
        {product?.attributes?.discount?.data && (
          <Badge tone="sale" className="self-start">
            <span dir="ltr">-{product?.attributes?.discount?.data?.attributes?.discount_percent}%</span>
          </Badge>
        )}

        <Skeleton isLoaded={product?.attributes?.price !== 0}>
          <div className="flex items-baseline gap-3">
            {product?.attributes?.discount?.data && (
              <span className="text-base md:text-lg text-garden-muted line-through">
                {formatAmount(product?.attributes?.price)}
              </span>
            )}
            <p className="order-first text-[1.75rem] md:text-[2rem] font-bold">
              {formatAmount(
                product?.attributes?.discount?.data ? priceAfterDiscount : product?.attributes?.price
              )}{" "}
              <span className="text-sm font-semibold">
                {currency("currency")}
              </span>
            </p>
          </div>
        </Skeleton>
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton isLoaded={product?.attributes?.category?.data ? true : false}>
          <h2 className="sr-only">{t("details.categories")}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {locale === "en"
              ? product?.attributes?.category?.data.map((cat) => (
                  <Link
                    key={cat?.id}
                    href={`/categories/${cat.attributes.name}`}
                  >
                    <span className="inline-flex items-center h-9 px-4 rounded-full bg-white border border-line text-sm font-semibold capitalize hover:border-garden transition-colors">
                      {cat?.attributes?.name}
                    </span>
                  </Link>
                ))
              : arabicData?.attributes?.category?.data.map((cat) => (
                  <Link
                    key={cat?.id}
                    href={`/categories/${cat.attributes.name}`}
                  >
                    <span className="inline-flex items-center h-9 px-4 rounded-full bg-white border border-line text-sm font-semibold capitalize hover:border-garden transition-colors">
                      {cat?.attributes?.name}
                    </span>
                  </Link>
                ))}
          </div>
        </Skeleton>
      </div>
    </div>
  );
};

export default DetailsSection;
