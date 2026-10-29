import type { Metadata } from "next";
import AdsSlider from "@/app/components/AdsSlider";
import FiltersSection from "@/app/components/FiltersSection";
import MiniProducts from "@/app/components/MiniProducts";
import ProductsSection from "@/app/components/ProductsSection";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { CATALOG_SOURCE, CategorySlider, HomeHero, serializeJsonLd } from "@/modules/catalog";
import PageContainer from "@/shared/ui/PageContainer";
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

const HomePage = async ({ params: { locale } }: HomePageProps) => {
  unstable_setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main>
      {CATALOG_SOURCE === "woo" ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd(locale)) }}
          />
          <PageContainer className="pt-2 md:pt-6 flex flex-col gap-12 md:gap-16">
            <HomeHero />
            <section className="flex flex-col gap-4 md:gap-6">
              <h2 className="font-display text-2xl md:text-[2rem] font-medium">{t("browse")}</h2>
              <CategorySlider />
            </section>
            <section className="flex flex-col gap-4 md:gap-6">
              <h2 className="font-display text-2xl md:text-[2rem] font-medium">{t("shopAll")}</h2>
              <FiltersSection />
              <ProductsSection />
            </section>
          </PageContainer>
        </>
      ) : (
        <>
          <MiniProducts />
          <AdsSlider />
          <PageContainer className="flex flex-col gap-5">
            <FiltersSection />
            <ProductsSection />
          </PageContainer>
        </>
      )}
    </main>
  );
};
export default HomePage;
