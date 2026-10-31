import FiltersSection from "@/app/components/FiltersSection";
import ProductsSection from "@/app/components/ProductsSection";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import React from "react";
import PageContainer from "@/shared/ui/PageContainer";

interface searchPageProps {
  params: { locale: string };
  searchParams: {
    q: string;
  };
}

const SearchPage = async ({ params: { locale }, searchParams }: searchPageProps) => {
  unstable_setRequestLocale(locale);
  const t = await getTranslations("search");
  return (
    <PageContainer className="flex flex-col gap-5">
      <h1 className="pt-6 md:pt-10 text-center font-display text-3xl md:text-[2.75rem] leading-tight font-medium">
        {searchParams.q ? (
          <>
            <span className="capitalize">{t("resultsFor")}</span> <q>{searchParams.q}</q>
          </>
        ) : (
          <span className="capitalize">{t("search")}</span>
        )}
      </h1>

      <FiltersSection />
      <ProductsSection />
    </PageContainer>
  );
};

export default SearchPage;
