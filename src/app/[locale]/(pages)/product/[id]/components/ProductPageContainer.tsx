"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import React, { useContext, useEffect } from "react";
import AddToCartButton from "./AddToCartButton";
import Breads from "./Breads";
import InformationSection from "./InformationSection";
import ImagesSection from "./ImagesSection";
import DetailsSection from "./DetailsSection";
import { getTheLengthOfAllowedRatings } from "@/functions/getTheLengthOfAllowedRatings";
import ReviewsSection from "./ReviewsSection";
import { useLocale } from "next-intl";
import { CATALOG_SOURCE } from "@/modules/catalog";
import WooProductPage from "./WooProductPage";

interface ProductPageContainerProps {
  // Define your props here
  id: string;
}

const StrapiProductPageContainer = observer(({ id }: ProductPageContainerProps) => {
  const { products } = useContext(StoreContext);
  const locale = useLocale();

  useEffect(() => {
    products.getSingleProduct(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Show loading state if product is not loaded yet
  if (!products.targetProduct) {
    return (
      <div className="relative" dir={locale === "en" ? "ltr" : "rtl"}>
        <div className="relative px-5 medmob:px-10 lmob:px-20 sm:px-32 md:px-20 lg:px-10 pb-5 mt-5">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading product...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" dir={locale === "en" ? "ltr" : "rtl"}>
      <AddToCartButton product={products.targetProduct} />

      <div className="relative px-5  medmob:px-10 lmob:px-20 sm:px-32 md:px-20 lg:px-10 pb-5 mt-5">
        <Breads
          title={
            locale === "en"
              ? (products.targetProduct?.attributes?.title?.slice(0, 40) || "Product") + "..."
              : (products.targetProduct?.attributes?.localizations?.data?.[0]?.attributes?.title?.slice(
                  0,
                  40
                ) || "Product") + "..."
          }
        />
        <div className="grid grid-cols-1 grid-rows-[auto_auto_auto] md:grid-cols-[3fr_6fr] lg:grid-cols-[2fr_6fr] xl:grid-cols-[1.5fr_6fr] md:grid-rows-1 pt-10 gap-10">
          <InformationSection />
          <div className="flex flex-col gap-20">
            <div className="grid grid-cols-1 grid-rows-[auto_auto] lg:grid-cols-2 lg:grid-rows-1 gap-10">
              <ImagesSection
                allImages={products.targetProduct?.attributes?.images}
              />
              <DetailsSection
                product={products.targetProduct}
                averageRating={products.getAverageRatings(
                  products.targetProductReviews
                )}
                priceAfterDiscount={products.getPriceAfterDiscount(
                  products.targetProduct?.attributes?.discount?.data,
                  products.targetProduct?.attributes?.price
                )}
                ratingsLength={getTheLengthOfAllowedRatings(
                  products.targetProductReviews
                )}
                arabicData={products.targetProductArabicData}
              />
            </div>

            <ReviewsSection product={products.targetProduct} />
          </div>
        </div>
      </div>
    </div>
  );
});
StrapiProductPageContainer.displayName = "StrapiProductPageContainer";

/** The [id] segment is a Strapi id on the legacy catalog and a product slug on Woo. */
const ProductPageContainer = ({ id }: ProductPageContainerProps) =>
  CATALOG_SOURCE === "woo" ? <WooProductPage slug={id} /> : <StrapiProductPageContainer id={id} />;

export default ProductPageContainer;
