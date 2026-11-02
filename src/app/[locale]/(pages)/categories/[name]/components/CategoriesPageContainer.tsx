"use client";
import React from "react";
import { MiniPromos } from "@/modules/content";
import FiltersSection from "@/app/components/FiltersSection";
import ProductsSection from "@/app/components/ProductsSection";
import { CategoryTitle } from "@/modules/catalog";
import PageContainer from "@/shared/ui/PageContainer";

interface CategoriesPageContainerProps {
  /** Category slug from the URL. */
  name: string;
}

const CategoriesPageContainer = ({ name }: CategoriesPageContainerProps) => {
  return (
    <main>
      <PageContainer className="flex flex-col gap-5">
        <CategoryTitle slug={name} />
        <MiniPromos />
        <FiltersSection />
        <ProductsSection />
      </PageContainer>
    </main>
  );
};

export default CategoriesPageContainer;
