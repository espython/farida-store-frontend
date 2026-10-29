"use client";
import type { ReactNode } from "react";
import { Image } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Money } from "@/shared/kernel/Money";
import type { Product } from "../domain/Product";
import { discountPercent } from "../domain/pricing";

interface Props {
  product: Product;
  /** Row layout for the list view. */
  row?: boolean;
  /** Cart and wishlist controls are injected by the cart module; none until it exists. */
  actions?: ReactNode;
}

/** Kitchen Garden product card: 1:1 image, 2-line title, price first, rating beside it. */
const CatalogProductCard = ({ product, row = false, actions }: Props) => {
  const locale = useLocale();
  const t = useTranslations("product");
  const currency = useTranslations("currency");
  const pct = discountPercent(product);
  const image = product.images[0];
  const left = product.stock.status === "low" ? product.stock.quantity : null;
  const href = `/product/${product.slug}`;

  return (
    <article
      dir={locale === "en" ? "ltr" : "rtl"}
      data-testid="catalog-product-card"
      className={`flex w-full ${row ? "flex-row gap-4 items-center" : "flex-col gap-3"}`}
    >
      <div className={`relative shrink-0 aspect-square rounded-[20px] overflow-hidden bg-sand ${row ? "w-1/3" : "w-full"}`}>
        <Link href={href} className="block w-full h-full" tabIndex={-1} aria-hidden="true">
          <Image
            src={image?.src ?? ""}
            alt=""
            radius="none"
            removeWrapper
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
          />
        </Link>
        <div className="absolute z-20 top-3 start-3 flex flex-col items-start gap-1.5 pointer-events-none">
          {pct > 0 && (
            <span className="px-3 py-0.5 rounded-full bg-saffron text-garden text-[0.8125rem] font-bold">
              <span className="sr-only">{t("sale")} </span>
              <span dir="ltr">-{pct}%</span>
            </span>
          )}
          {product.stock.status === "out_of_stock" && (
            <span className="px-3 py-0.5 rounded-full bg-garden text-cream text-[0.8125rem] font-semibold">
              {t("outOfStock")}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <h3 className="text-base md:text-[1.0625rem] font-semibold leading-snug line-clamp-2 min-h-[2.75em]">
          <Link href={href} className="hover:text-saffron-ink transition-colors">
            {product.title}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-bold">
              {Money.toDisplay(product.price)}{" "}
              <span className="text-sm font-semibold">{currency("currency")}</span>
            </span>
            <span className="text-sm text-garden-muted">
              {product.regularPrice && (
                <>
                  <span className="line-through">{Money.toDisplay(product.regularPrice)}</span>
                  {product.rating.count > 0 && " · "}
                </>
              )}
              {product.rating.count > 0 && (
                <span>
                  <span aria-hidden="true">★</span> {product.rating.average.toFixed(1)} ({product.rating.count})
                </span>
              )}
            </span>
          </div>
          {actions}
        </div>
        {left !== null && (
          <span className="text-sm font-bold text-saffron-ink">
            {t("onlyLeft")}: {left}
          </span>
        )}
      </div>
    </article>
  );
};

export default CatalogProductCard;
