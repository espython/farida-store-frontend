"use client";
import { Button } from "@nextui-org/react";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageSkeleton from "@/components/feedback/PageSkeleton";
import {
  BestSellers,
  ProductDetails,
  ProductGallery,
  useGetProductQuery,
} from "@/modules/catalog";
import type { Locale } from "@/shared/kernel/Locale";
import Breads from "./Breads";
import InformationSection from "./InformationSection";

const BREAD_TITLE_MAX = 40;

/**
 * Product page on the Woo catalog. The route segment is the product slug (cards link
 * by slug). Add to cart and reviews come with the cart (C1-C3) and reviews (O3) work.
 */
const WooProductPage = ({ slug }: { slug: string }) => {
  const locale = useLocale() as Locale;
  const t = useTranslations("errorPage");
  const { data: product, isLoading, isError, error, refetch } = useGetProductQuery({ locale, slug });

  if (isLoading) return <PageSkeleton variant="detail" />;
  if (isError && "status" in error && error.status === 404) notFound();
  if (isError || !product) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center gap-4" role="alert">
        <h1 className="text-lg md:text-2xl text-mainBlack/70">{t("title")}</h1>
        <Button className="bg-mainPink text-mainWhite" onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  const breadTitle =
    product.title.length > BREAD_TITLE_MAX
      ? `${product.title.slice(0, BREAD_TITLE_MAX)}…`
      : product.title;

  return (
    <div className="relative" dir={locale === "en" ? "ltr" : "rtl"}>
      <div className="relative px-5 medmob:px-10 lmob:px-20 sm:px-32 md:px-20 lg:px-10 pb-5 mt-5">
        <Breads title={breadTitle} />
        <div className="grid grid-cols-1 grid-rows-[auto_auto_auto] md:grid-cols-[3fr_6fr] lg:grid-cols-[2fr_6fr] xl:grid-cols-[1.5fr_6fr] md:grid-rows-1 pt-10 gap-10">
          <InformationSection bestSellers={<BestSellers excludeId={product.id} />} />
          <div className="grid grid-cols-1 grid-rows-[auto_auto] lg:grid-cols-2 lg:grid-rows-1 gap-10 content-start">
            <ProductGallery images={product.images} title={product.title} />
            <ProductDetails product={product} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WooProductPage;
