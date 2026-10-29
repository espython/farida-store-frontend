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
    <ul className="flex flex-col">
      {categories.categories?.map((cat) => (
        <li key={cat.id}>
          <Link
            href={`/categories/${cat.attributes.name}`}
            aria-current={editedParams === cat.attributes.name ? "page" : undefined}
            className={`flex items-center justify-between gap-3 min-h-[44px] px-3 -mx-3 rounded-xl hover:bg-sand transition-colors capitalize ${
              editedParams === cat.attributes.name ? "font-bold text-saffron-ink" : ""
            }`}
          >
            <span>
              {locale === "en"
                ? cat.attributes.name
                : cat.attributes?.localizations?.data[0].attributes.name}
            </span>
            <span className="text-sm text-garden-muted">({cat.attributes.products.data.length})</span>
          </Link>
        </li>
      ))}
    </ul>
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
