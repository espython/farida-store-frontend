"use client";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import Rating from "@/components/Rating";
import { htmlToText } from "@/shared/lib/htmlText";
import Badge from "@/shared/ui/Badge";
import type { Product } from "../domain/Product";
import { discountPercent } from "../domain/pricing";
import Price from "./Price";

interface Props {
  product: Product;
  /** Add-to-cart and wishlist controls are injected by the cart module; none until it exists. */
  actions?: ReactNode;
  /** The page shows the long description in its own section below the fold. */
  showDescription?: boolean;
  /** Trust points (shipping, returns...) under the actions. */
  footer?: ReactNode;
}

/** Kitchen Garden buy box: categories, title, rating, price, stock, options, actions. */
const ProductDetails = ({ product, actions, showDescription = true, footer }: Props) => {
  const locale = useLocale();
  const t = useTranslations("productPage");
  const card = useTranslations("product");
  const pct = discountPercent(product);
  const description = htmlToText(product.description || product.shortDescription);
  const summary = htmlToText(product.shortDescription);
  const { status, quantity } = product.stock;

  return (
    <div className="flex flex-col gap-5" data-testid="product-details">
      {product.categories.length > 0 && (
        <nav aria-label={t("details.categories")} className="flex flex-wrap gap-x-3 gap-y-1">
          {product.categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="text-sm font-bold uppercase tracking-wider text-saffron-ink hover:underline"
            >
              {cat.title}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[1.75rem] md:text-[2.5rem] leading-[1.1] font-medium">{product.title}</h1>
        {product.rating.count > 0 && (
          <div className="flex items-center gap-2">
            <Rating rating={product.rating.average} />
            <span className="text-sm text-garden-muted">({product.rating.count})</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Price price={product.price} regularPrice={product.regularPrice} size="lg" />
        {pct > 0 && (
          <Badge tone="sale">
            <span dir="ltr">-{pct}%</span>
          </Badge>
        )}
      </div>

      <p className="flex flex-wrap items-center gap-2 font-semibold capitalize">
        <span
          aria-hidden="true"
          className={`w-2.5 h-2.5 rounded-full ${status === "out_of_stock" ? "bg-[#b42318]" : status === "low" ? "bg-saffron" : "bg-garden-600"}`}
        />
        <span className="sr-only">{t("details.status")}: </span>
        {status === "out_of_stock" ? (
          <span className="text-[#b42318]">{t("details.outStock")}</span>
        ) : (
          <span>{t("details.inStock")}</span>
        )}
        {status === "low" && quantity !== null && (
          <span className="text-saffron-ink font-bold">
            ({card("onlyLeft")}: {quantity})
          </span>
        )}
      </p>

      {!showDescription && summary && <p className="text-garden-muted">{summary}</p>}

      {product.attributes.length > 0 && (
        <dl className="flex flex-col gap-1">
          {product.attributes.map((attr) => (
            <div key={attr.slug} className="flex gap-2">
              <dt className="font-semibold capitalize">{attr.name}:</dt>
              <dd>{attr.terms.map((term) => term.name).join(locale === "ar" ? "، " : ", ")}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions}

      {footer}

      {showDescription && description && (
        <div className="flex flex-col gap-2 pt-5 border-t border-line">
          <h2 className="font-display text-xl capitalize">{t("details.description")}</h2>
          <p className="whitespace-pre-line text-garden/90">{description}</p>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
