"use client";
import type { ReactNode } from "react";
import { Chip, Divider } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { useScreenSize } from "react-screen-size-helper";
import { Link } from "@/navigation";
import Rating from "@/components/Rating";
import { Money } from "@/shared/kernel/Money";
import { htmlToText } from "@/shared/lib/htmlText";
import type { Product } from "../domain/Product";
import { discountPercent } from "../domain/pricing";

interface Props {
  product: Product;
  /** Add-to-cart and wishlist controls are injected by the cart module; none until it exists. */
  actions?: ReactNode;
}

const ProductDetails = ({ product, actions }: Props) => {
  const { currentWidth } = useScreenSize({});
  const locale = useLocale();
  const t = useTranslations("productPage");
  const card = useTranslations("product");
  const currency = useTranslations("currency");
  const pct = discountPercent(product);
  const description = htmlToText(product.description || product.shortDescription);
  const { status, quantity } = product.stock;

  return (
    <div className="flex flex-col gap-5" data-testid="product-details">
      <div className="flex flex-col gap-3">
        <h1 className="text-lg md:text-2xl">{product.title}</h1>
        <div className="flex items-center gap-2">
          <Rating rating={product.rating.average} size={currentWidth > 768 ? "1.5rem" : "1rem"} />
          <span className="text-mainBlack/50 text-sm md:text-xl">({product.rating.count})</span>
        </div>
      </div>

      {description && (
        <div className="flex flex-col gap-3">
          <h2 className="capitalize text-sm md:text-xl font-semibold">{t("details.description")}</h2>
          <p className="text-sm md:text-xl whitespace-pre-line">{description}</p>
        </div>
      )}

      <p className="text-sm md:text-xl font-semibold capitalize">
        {t("details.status")}:{" "}
        {status === "out_of_stock" ? (
          <span className="text-red-700">{t("details.outStock")}</span>
        ) : (
          <span className="text-green-700">{t("details.inStock")}</span>
        )}
        {status === "low" && quantity !== null && (
          <span className="text-amber-700 font-normal ltr:ml-2 rtl:mr-2">
            ({card("onlyLeft")}: {quantity})
          </span>
        )}
      </p>

      <div className="flex flex-col gap-2">
        {pct > 0 && (
          <div className="bg-green-500 p-1 pe-3 md:p-2 md:pe-5 w-max ltr:rounded-r-full rtl:rounded-l-full">
            <span className="capitalize text-white font-semibold text-lg md:text-2xl">
              {t("details.discount")} {pct}%
            </span>
          </div>
        )}
        <div className="flex items-center gap-5">
          {product.regularPrice && (
            <span className="text-xl md:text-3xl text-mainBlack/30 font-bold line-through">
              {Money.toDecimal(product.regularPrice)}
              <span className="text-sm ltr:ml-1 rtl:mr-1">{currency("currency")}</span>
            </span>
          )}
          <span className="text-xl md:text-3xl text-mainBlack/70 font-bold">
            {Money.toDecimal(product.price)}
            <span className="text-sm ltr:ml-1 rtl:mr-1">{currency("currency")}</span>
          </span>
        </div>
      </div>

      {product.attributes.length > 0 && (
        <dl className="flex flex-col gap-1 text-sm md:text-lg">
          {product.attributes.map((attr) => (
            <div key={attr.slug} className="flex gap-2">
              <dt className="font-semibold capitalize">{attr.name}:</dt>
              <dd>{attr.terms.map((term) => term.name).join(locale === "ar" ? "، " : ", ")}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions}

      {product.categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <Divider />
          <h2 className="text-sm md:text-xl capitalize font-semibold">{t("details.categories")}</h2>
          <div className="flex items-center gap-5 flex-wrap mt-3">
            {product.categories.map((cat) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`}>
                <Chip
                  variant="bordered"
                  classNames={{
                    base: "text-xs md:text-lg capitalize hover:text-mainBlack hover:border-mainBlack transition-all",
                  }}
                >
                  {cat.title}
                </Chip>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
