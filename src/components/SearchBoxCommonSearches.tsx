"use client";

import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import React, { useContext } from "react";

interface commonSearchProps {
  searchForResult: (param: string) => void;
}

const SearchBoxCommonSearches = ({ searchForResult }: commonSearchProps) => {
  const { categories } = useContext(StoreContext);
  const t = useTranslations("search");

  return (
    <div
      key={"common search"}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <span className="text-sm font-semibold capitalize text-garden-muted">{t("common")}</span>

      {categories.someCategories?.map((cat) => (
        <button
          type="button"
          key={cat.id}
          onClick={() => {
            searchForResult(cat.attributes.name);
          }}
          className="inline-flex items-center h-10 px-4 rounded-full bg-white border border-line text-sm font-semibold hover:border-garden transition-colors"
        >
          {cat.attributes.name}
        </button>
      ))}
    </div>
  );
};

export default observer(SearchBoxCommonSearches);
