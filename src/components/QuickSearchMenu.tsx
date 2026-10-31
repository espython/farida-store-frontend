"use client";
import React, { useContext, useEffect } from "react";
import MiniSearchProduct from "./MiniSearchProduct";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { buttonClass } from "@/shared/ui/Button";
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
    <div className="flex flex-col gap-5 items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-3">
        {searchBox.quickProducts.map((product) => (
          <MiniSearchProduct key={product.id} product={product} />
        ))}
      </div>

      {searchBox.quickProducts.length > 0 && (
        <Button
          className={`${buttonClass({ variant: "outline" })} capitalize`}
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
