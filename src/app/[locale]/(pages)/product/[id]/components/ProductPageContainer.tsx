"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import React, { useContext, useEffect } from "react";
import AddToCartButton from "./AddToCartButton";
import Breads from "./Breads";
import BestSellerMenu from "./BestSellerMenu";
import PageSkeleton from "@/components/feedback/PageSkeleton";
import PageContainer from "@/shared/ui/PageContainer";
import SectionHeading from "@/shared/ui/SectionHeading";
import TrustList from "@/shared/ui/TrustList";
import ImagesSection from "./ImagesSection";
import DetailsSection from "./DetailsSection";
import { getTheLengthOfAllowedRatings } from "@/functions/getTheLengthOfAllowedRatings";
import ReviewsSection from "./ReviewsSection";
import { useLocale, useTranslations } from "next-intl";
import { CATALOG_SOURCE } from "@/modules/catalog";
import type { Product } from "@/modules/catalog";
import WooProductPage from "./WooProductPage";

interface ProductPageContainerProps {
  // Define your props here
  id: string;
}

const StrapiProductPageContainer = observer(({ id }: ProductPageContainerProps) => {
  const { products } = useContext(StoreContext);
  const locale = useLocale();
  const tPage = useTranslations("productPage");

  useEffect(() => {
    products.getSingleProduct(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Show loading state if product is not loaded yet
  if (!products.targetProduct) {
    return <PageSkeleton variant="detail" />;
  }

  const title =
    locale === "en"
      ? products.targetProduct?.attributes?.title
      : products.targetProduct?.attributes?.localizations?.data?.[0]?.attributes?.title;

  return (
    <div dir={locale === "en" ? "ltr" : "rtl"}>
      <AddToCartButton product={products.targetProduct} placement="bar" />

      <PageContainer className="pt-4 md:pt-6 flex flex-col gap-12 md:gap-16">
        <div className="flex flex-col gap-5">
          <Breads title={title && title.length > 40 ? `${title.slice(0, 40)}…` : title || "Product"} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7">
              <ImagesSection allImages={products.targetProduct?.attributes?.images} />
            </div>
            <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col gap-5">
              <DetailsSection
                product={products.targetProduct}
                averageRating={products.getAverageRatings(products.targetProductReviews)}
                priceAfterDiscount={products.getPriceAfterDiscount(
                  products.targetProduct?.attributes?.discount?.data,
                  products.targetProduct?.attributes?.price
                )}
                ratingsLength={getTheLengthOfAllowedRatings(products.targetProductReviews)}
                arabicData={products.targetProductArabicData}
              />
              <AddToCartButton product={products.targetProduct} placement="inline" />
              <TrustList />
            </div>
          </div>
        </div>

        <ReviewsSection product={products.targetProduct} />

        <section className="flex flex-col gap-4 md:gap-6">
          <SectionHeading>
            <span className="capitalize">{tPage("bestSeller")}</span>
          </SectionHeading>
          <BestSellerMenu />
        </section>
      </PageContainer>
    </div>
  );
});
StrapiProductPageContainer.displayName = "StrapiProductPageContainer";

/** The [id] segment is a Strapi id on the legacy catalog and a product slug on Woo. */
const ProductPageContainer = ({ id, initialProduct }: ProductPageContainerProps & { initialProduct?: Product }) =>
  CATALOG_SOURCE === "woo" ? (
    <WooProductPage slug={id} initialProduct={initialProduct} />
  ) : (
    <StrapiProductPageContainer id={id} />
  );

export default ProductPageContainer;
