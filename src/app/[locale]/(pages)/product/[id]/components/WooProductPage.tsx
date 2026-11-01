"use client";
import { Button } from "@nextui-org/react";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageSkeleton from "@/components/feedback/PageSkeleton";
import {
  BestSellers,
  ProductDetails,
  ProductGallery,
  useGetProductQuery,
} from "@/modules/catalog";
import type { Product } from "@/modules/catalog";
import { AddToCartButton, toProductRef } from "@/modules/cart";
import { WishlistButton } from "@/modules/wishlist";
import { ProductReviews } from "@/modules/reviews";
import type { Locale } from "@/shared/kernel/Locale";
import Breads from "./Breads";
import PageContainer from "@/shared/ui/PageContainer";
import EmptyState from "@/shared/ui/EmptyState";
import SectionHeading from "@/shared/ui/SectionHeading";
import TrustList from "@/shared/ui/TrustList";
import { buttonClass } from "@/shared/ui/Button";
import { htmlToText } from "@/shared/lib/htmlText";

const BREAD_TITLE_MAX = 40;

interface Props {
  slug: string;
  /** Fetched by the server page, so the first render (and the HTML) has the product. */
  initialProduct?: Product;
}

/**
 * Product page. The route segment is the product slug (cards link by slug). The page
 * composes catalog, cart, wishlist and reviews (the catalog imports none of them).
 */
const WooProductPage = ({ slug, initialProduct }: Props) => {
  const locale = useLocale() as Locale;
  const t = useTranslations("errorPage");
  const details = useTranslations("productPage");
  const { data, isLoading, isError, error, refetch } = useGetProductQuery({ locale, slug });
  // Server data until the client query answers; a failed refresh keeps showing it.
  const product = data ?? initialProduct;

  if (isLoading && !product) return <PageSkeleton variant="detail" />;
  if (isError && "status" in error && error.status === 404) notFound();
  if (!product) {
    return (
      <PageContainer className="py-16">
        <EmptyState
          role="alert"
          title={t("title")}
          action={
            <Button className={buttonClass()} onClick={() => refetch()}>
              {t("retry")}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const breadTitle =
    product.title.length > BREAD_TITLE_MAX
      ? `${product.title.slice(0, BREAD_TITLE_MAX)}…`
      : product.title;
  const description = htmlToText(product.description);

  return (
    <div dir={locale === "en" ? "ltr" : "rtl"}>
      <PageContainer className="pt-4 md:pt-6 flex flex-col gap-12 md:gap-16">
        <div className="flex flex-col gap-5">
          <Breads title={breadTitle} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7">
              <ProductGallery images={product.images} title={product.title} />
            </div>
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <ProductDetails
                product={product}
                showDescription={false}
                actions={
                  <>
                    <AddToCartButton product={toProductRef(product)} variant="full" />
                    <WishlistButton productId={product.id} title={product.title} variant="full" />
                  </>
                }
                footer={<TrustList />}
              />
            </div>
          </div>
        </div>

        {description && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12">
            <h2 className="lg:col-span-4 font-display text-2xl md:text-[2rem] font-medium capitalize">
              {details("details.description")}
            </h2>
            <p className="lg:col-span-8 whitespace-pre-line leading-relaxed">{description}</p>
          </section>
        )}

        <ProductReviews productId={product.id} rating={product.rating} />

        <section className="flex flex-col gap-4 md:gap-6">
          <SectionHeading>
            <span className="capitalize">{details("bestSeller")}</span>
          </SectionHeading>
          <BestSellers
            excludeId={product.id}
            renderActions={(p) => <AddToCartButton product={toProductRef(p)} />}
            renderOverlay={(p) => <WishlistButton productId={p.id} title={p.title} />}
          />
        </section>
      </PageContainer>
    </div>
  );
};

export default WooProductPage;
