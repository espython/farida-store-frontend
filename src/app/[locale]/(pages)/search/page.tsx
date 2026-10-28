import FiltersSection from "@/app/components/FiltersSection";
import ProductsSection from "@/app/components/ProductsSection";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import React from "react";

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
    <div>
      <div className=" flex flex-wrap gap-2 px-10 md:px-20 text-2xl md:text-4xl items-center justify-center py-10">
        <h1 className="  font-bold capitalize  text-center ">
          {t("resultsFor")}:
        </h1>
        <q className="text-center">{searchParams.q}</q>
      </div>

      <FiltersSection />
      <ProductsSection />
    </div>
  );
};

export default SearchPage;
