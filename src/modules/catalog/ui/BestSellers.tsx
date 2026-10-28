"use client";
import { Divider, Image, Skeleton } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import type { Locale } from "@/shared/kernel/Locale";
import { Money } from "@/shared/kernel/Money";
import { useGetProductsQuery } from "../application/catalogApi";

interface Props {
  /** Product to leave out, e.g. the one on the current page. */
  excludeId?: string;
  count?: number;
}

/** Side list of the most popular products (Woo total_sales). Renders nothing on error. */
const BestSellers = ({ excludeId, count = 4 }: Props) => {
  const locale = useLocale() as Locale;
  const currency = useTranslations("currency");
  // One extra so the list stays full after dropping the current product.
  const { data, isLoading } = useGetProductsQuery({ locale, sort: "popularity", perPage: count + 1 });
  const items = (data?.items ?? []).filter((p) => p.id !== excludeId).slice(0, count);

  if (isLoading) {
    return <Skeleton className="w-full h-64 rounded-md" />;
  }
  if (items.length === 0) return null;

  return (
    <ul className="w-full h-auto border-2 border-mainGray border-solid" data-testid="best-sellers">
      {items.map((p, i) => (
        <li key={p.id}>
          <div className="flex flex-col p-3">
            <Link
              href={`/product/${p.slug}`}
              className="w-full h-auto flex items-center justify-center aspect-square"
            >
              <Image
                src={p.images[0]?.thumbnail || p.images[0]?.src || ""}
                alt={p.images[0]?.alt || p.title}
                className="w-full h-full"
                classNames={{ img: "w-full object-contain" }}
              />
            </Link>
            <div className="flex flex-col gap-2 pt-2">
              <Link href={`/product/${p.slug}`}>
                <h3 className="text-lg md:text-xl transition-all hover:text-mainPink line-clamp-2">
                  {p.title}
                </h3>
              </Link>
              <div className="flex flex-wrap items-center gap-5">
                {p.regularPrice && (
                  <span className="text-xl md:text-2xl text-mainBlack/30 font-bold line-through">
                    {Money.toDecimal(p.regularPrice)}
                    <span className="text-sm ltr:ml-1 rtl:mr-1">{currency("currency")}</span>
                  </span>
                )}
                <span className="text-xl md:text-2xl text-mainBlack/70 font-bold">
                  {Money.toDecimal(p.price)}
                  <span className="text-sm ltr:ml-1 rtl:mr-1">{currency("currency")}</span>
                </span>
              </div>
            </div>
          </div>
          {i < items.length - 1 && <Divider />}
        </li>
      ))}
    </ul>
  );
};

export default BestSellers;
