"use client";
import { useLocale } from "next-intl";
import PageTitle from "@/components/PageTitle";
import type { Locale } from "@/shared/kernel/Locale";
import { useGetCategoriesQuery } from "../application/catalogApi";
import { findCategory, titleFromSlug } from "../application/lookups";

/** Category page heading: the localized Woo category name, or a readable slug until it loads. */
const CategoryTitle = ({ slug }: { slug: string }) => {
  const locale = useLocale() as Locale;
  const { data } = useGetCategoriesQuery(locale);
  return <PageTitle title={findCategory(data, slug)?.title ?? titleFromSlug(slug)} />;
};

export default CategoryTitle;
