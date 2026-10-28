"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useLocale } from "next-intl";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { Link } from "@/navigation";
import { useParams } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import { CATALOG_SOURCE, CategoryLinks } from "@/modules/catalog";

const StrapiFilterSidebarLinks = () => {
  const { categories } = useContext(StoreContext);
  const urlParams: Params = useParams();
  const locale = useLocale();

  const [editedParams, setEditedParam] = useState<string>("");

  useEffect(() => {
    if (urlParams.name) {
      setEditedParam(urlParams.name.replaceAll("%20", " "));
    }

    categories.getAllCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {categories.categories?.map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.attributes.name}`}
          className={`filter-link ${
            editedParams === cat.attributes.name && `text-mainPink`
          }`}
        >
          <h1>
            {locale === "en"
              ? cat.attributes.name
              : cat.attributes?.localizations?.data[0].attributes.name}
          </h1>
          <h1>({cat.attributes.products.data.length})</h1>
        </Link>
      ))}
    </div>
  );
};

const ObservedStrapiLinks = observer(StrapiFilterSidebarLinks);

const WooFilterSidebarLinks = () => {
  const { filter } = useContext(StoreContext);
  return <CategoryLinks onSelect={filter.hideWholeFilterSidebar} />;
};

const FilterSidebarLinks = () =>
  CATALOG_SOURCE === "woo" ? <WooFilterSidebarLinks /> : <ObservedStrapiLinks />;

export default FilterSidebarLinks;
