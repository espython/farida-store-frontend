import type { Metadata } from "next";
import AdsSlider from "@/app/components/AdsSlider";
import FiltersSection from "@/app/components/FiltersSection";
import MiniProducts from "@/app/components/MiniProducts";
import ProductsSection from "@/app/components/ProductsSection";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { CATALOG_SOURCE, serializeJsonLd } from "@/modules/catalog";
import { isLocale, LOCALES } from "@/shared/kernel/Locale";
import { absoluteUrl, ogLocale, SITE_URL } from "@/shared/lib/siteUrl";

interface HomePageProps {
  params: { locale: string };
}

const SITE_NAME = "Farida Store";

export async function generateMetadata({ params: { locale } }: HomePageProps): Promise<Metadata> {
  // Same gate as product and category pages: the Woo storefront is the one with SITE_URL set.
  if (CATALOG_SOURCE !== "woo" || !isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "home" });
  const description = t("metaDescription");
  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: SITE_NAME },
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: "website",
      url: `/${locale}`,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      locale: ogLocale(locale),
    },
  };
}

/** WebSite JSON-LD with a sitelinks search box pointing at the search page. */
const websiteJsonLd = (locale: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: absoluteUrl(`/${locale}`),
  inLanguage: locale,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl(`/${locale}/search`)}?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

const HomePage = ({ params: { locale } }: HomePageProps) => {
  unstable_setRequestLocale(locale);

  return (
    <main>
      {CATALOG_SOURCE === "woo" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd(locale)) }}
        />
      )}
      <MiniProducts />

      <AdsSlider />

      <FiltersSection />
      <ProductsSection />
    </main>
  );
};
export default HomePage;
