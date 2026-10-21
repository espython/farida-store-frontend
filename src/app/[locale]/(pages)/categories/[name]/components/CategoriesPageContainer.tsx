"use client";
import PageTitle from "@/components/PageTitle";
import React, { useContext, useEffect } from "react";
import MiniAdsSection from "./MiniAdsSection";
import FiltersSection from "@/app/components/FiltersSection";
import ProductsSection from "@/app/components/ProductsSection";
import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import { useLocale } from "next-intl";
import { CATALOG_SOURCE, CategoryTitle } from "@/modules/catalog";

interface CategoriesPageContainerProps {
  // Define your props here
  name: string;
}

const StrapiCategoryTitle = observer(({ name }: CategoriesPageContainerProps) => {
  const { categories } = useContext(StoreContext);
  const locale = useLocale();

  useEffect(() => {
    categories.getArabicCategory(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return (
    <PageTitle
      title={`${
        locale === "en" ? name.replaceAll("%20", " ") : categories.arabicCategory
      }`}
    />
  );
});
StrapiCategoryTitle.displayName = "StrapiCategoryTitle";

const CategoriesPageContainer = ({ name }: CategoriesPageContainerProps) => {
  return (
    <main>
      {CATALOG_SOURCE === "woo" ? (
        <CategoryTitle slug={name} />
      ) : (
        <StrapiCategoryTitle name={name} />
      )}
      <MiniAdsSection />
      <FiltersSection />
      <ProductsSection />
    </main>
  );
};

export default CategoriesPageContainer;
