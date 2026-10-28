"use client";
import React, { useContext, useEffect } from "react";
import MiniSearchProduct from "./MiniSearchProduct";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { Button } from "@nextui-org/react";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";

const QuickSearchMenu = () => {
  const { searchBox } = useContext(StoreContext);
  const t = useTranslations("search");
  const locale = useLocale();

  const router = useRouter();

  const searchForResult = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    searchBox.hideWholeSearchBox();

    searchBox.setSearchInputValue("");
  };

  useEffect(() => {
    if (searchBox.searchInputValue.length > 0) {
      searchBox.quickSearch(searchBox.searchInputValue);
    } else {
      searchBox.setQuickProducts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchBox.searchInputValue]);

  return (
    <div className="flex flex-col gap-5 items-center justify-center  xl:px-28 2xl:px-32">
      <div className="grid grid-cols-1 grid-rows-4 md:grid-cols-2 w-full px-5 md:grid-rows-2 gap-5">
        {searchBox.quickProducts.map((product) => (
          <MiniSearchProduct key={product.id} product={product} />
        ))}
      </div>

      {searchBox.quickProducts.length > 0 && (
        <Button
          className="bg-mainBlack text-mainWhite p-2 md:p-3 capitalize"
          onClick={() => {
            searchForResult(searchBox.searchInputValue);
          }}
        >
          {t("results")}
        </Button>
      )}
    </div>
  );
};

export default observer(QuickSearchMenu);
