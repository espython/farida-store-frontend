import type { Metadata } from "next";
import { findCategory } from "@/modules/catalog";
import { listCategories } from "@/modules/catalog/index.server";
import { isLocale, LOCALES } from "@/shared/kernel/Locale";
import type { Locale } from "@/shared/kernel/Locale";
import { ogLocale, SITE_URL } from "@/shared/lib/siteUrl";
import CategoriesPageContainer from "./components/CategoriesPageContainer";

interface categoriesPageProps {
  params: { name: string; locale: string };
}

const categoryPath = (locale: Locale, slug: string) => `/${locale}/categories/${slug}`;

export async function generateMetadata({ params }: categoriesPageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const locale = params.locale;
  // The category list is a cached Woo fetch shared with the BFF; an outage keeps the defaults.
  const category = await listCategories(locale)
    .then((all) => findCategory(all, params.name))
    .catch(() => undefined);
  if (!category) return {};
  return {
    metadataBase: new URL(SITE_URL),
    title: category.title,
    alternates: {
      canonical: categoryPath(locale, category.slug),
      languages: Object.fromEntries(LOCALES.map((l) => [l, categoryPath(l, category.slug)])),
    },
    openGraph: {
      type: "website",
      url: categoryPath(locale, category.slug),
      title: category.title,
      locale: ogLocale(locale),
      images: category.image ? [{ url: category.image.src, alt: category.image.alt || category.title }] : undefined,
    },
  };
}

const CategoriesPage = ({ params }: categoriesPageProps) => {
  return <CategoriesPageContainer name={params.name} />;
};

export default CategoriesPage;
