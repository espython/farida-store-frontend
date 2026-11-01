"use client";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LuHeart } from "react-icons/lu";
import { Link } from "@/navigation";
import EmptyState from "@/shared/ui/EmptyState";
import { buttonClass } from "@/shared/ui/Button";
import type { Locale } from "@/shared/kernel/Locale";
import { CatalogProductCard, useGetProductsQuery, type Product } from "@/modules/catalog";
import { useWishlist } from "../application/useWishlist";
import WishlistButton from "./WishlistButton";

interface Props {
  /** Cart controls for each card, composed by the page (the wishlist never imports the cart). */
  renderActions?: (product: Product) => ReactNode;
}

const Loading = () => (
  <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6" aria-busy="true">
    {[0, 1, 2, 3].map((i) => (
      <li key={i} className="aspect-square rounded-[20px] bg-sand animate-pulse" />
    ))}
  </ul>
);

/** The saved products, newest first, read from the catalog (current price and stock). */
const WishlistView = ({ renderActions }: Props) => {
  const t = useTranslations("wishlist");
  const locale = useLocale() as Locale;
  const { productIds, hydrated, source } = useWishlist();
  const q = useGetProductsQuery({ locale, ids: productIds.join(",") }, { skip: !hydrated || productIds.length === 0 });

  if (!hydrated || (productIds.length > 0 && q.isLoading)) return <Loading />;

  if (q.isError) {
    return (
      <EmptyState
        role="alert"
        title={t("unavailable")}
        action={
          <button type="button" className={buttonClass()} onClick={() => q.refetch()}>
            {t("retry")}
          </button>
        }
      />
    );
  }

  // Ids of products no longer sold are simply not returned.
  const products = productIds.length > 0 ? q.data?.items ?? [] : [];
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<LuHeart />}
        title={t("empty")}
        text={t("emptyText")}
        action={
          <Link href="/" className={buttonClass()}>
            {t("browse")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-garden-muted">{t("count", { count: products.length })}</p>
        {source === "browser" && (
          <p className="text-sm text-garden-muted">
            {t.rich("guestNote", { link: (chunks) => <Link href="/login" className="font-semibold underline">{chunks}</Link> })}
          </p>
        )}
      </div>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6">
        {products.map((p) => (
          <li key={p.id}>
            <CatalogProductCard
              product={p}
              actions={renderActions?.(p)}
              overlay={<WishlistButton productId={p.id} title={p.title} />}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WishlistView;
