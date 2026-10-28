import React from "react";
import ProductsSlider from "./ProductsSlider";
import { useTranslations } from "next-intl";
import { CATALOG_SOURCE, CategorySlider } from "@/modules/catalog";

const MiniProducts = () => {
  const t = useTranslations("home");

  return (
    <div className=" flex flex-col gap-10 w-auto  bg-mainGray py-10 px-5 md:p-10">
      <h1 className="text-center font-bold capitalize text-4xl sm:text-6xl">
        {t("title")}
      </h1>

      {CATALOG_SOURCE === "woo" ? <CategorySlider /> : <ProductsSlider />}
    </div>
  );
};

export default MiniProducts;
