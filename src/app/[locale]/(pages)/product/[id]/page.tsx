import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_setRequestLocale } from "next-intl/server";
import {
  CATALOG_SOURCE,
  productJsonLd,
  productMetaDescription,
  serializeJsonLd,
} from "@/modules/catalog";
import type { Product } from "@/modules/catalog";
import { getProductBySlug } from "@/modules/catalog/index.server";
import { AppError } from "@/shared/kernel/AppError";
import { isLocale, LOCALES } from "@/shared/kernel/Locale";
import type { Locale } from "@/shared/kernel/Locale";
import { absoluteUrl, ogLocale, SITE_URL } from "@/shared/lib/siteUrl";
import ProductPageContainer from "./components/ProductPageContainer";

interface productPageProps {
  params: { id: string; locale: string };
}

const productPath = (locale: Locale, slug: string) => `/${locale}/product/${slug}`;

/**
 * The product for SEO, on the Woo catalog only. Undefined when the shop is unreachable:
 * the client page then shows its own retry. Woo fetches are cached, so metadata and
 * page share one request.
 */
async function loadProduct({ id, locale }: productPageProps["params"]): Promise<Product | undefined> {
  if (CATALOG_SOURCE !== "woo" || !isLocale(locale)) return undefined;
  try {
    return await getProductBySlug(id, locale);
  } catch (err) {
    if (err instanceof AppError && err.status === 404) notFound();
    return undefined;
  }
}

export async function generateMetadata({ params }: productPageProps): Promise<Metadata> {
  const product = await loadProduct(params);
  if (!product) return {};
  const locale = product.locale;
  const description = productMetaDescription(product) || undefined;
  const image = product.images[0];
  return {
    metadataBase: new URL(SITE_URL),
    title: product.title,
    description,
    alternates: {
      canonical: productPath(locale, product.slug),
      languages: Object.fromEntries(LOCALES.map((l) => [l, productPath(l, product.slug)])),
    },
    openGraph: {
      type: "website",
      url: productPath(locale, product.slug),
      title: product.title,
      description,
      locale: ogLocale(locale),
      images: image ? [{ url: image.src, alt: image.alt || product.title }] : undefined,
    },
  };
}

const ProductPage = async ({ params }: productPageProps) => {
  unstable_setRequestLocale(params.locale);
  const product = await loadProduct(params);
  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(productJsonLd(product, absoluteUrl(productPath(product.locale, product.slug)))),
          }}
        />
      )}
      <ProductPageContainer id={params.id} />
    </>
  );
};

export default ProductPage;
