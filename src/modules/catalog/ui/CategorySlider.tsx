"use client";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button, Image, Skeleton } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import type { Locale } from "@/shared/kernel/Locale";
import { useGetCategoriesQuery } from "../application/catalogApi";
import { featuredCategories } from "../application/lookups";
import type { Category } from "../domain/Category";

/** Pointer travel (px) after which a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 5;
const SKELETON_COUNT = 4;

const cardClass =
  "bg-white min-w-[10rem] sm:min-w-[30rem] grid grid-rows-[3fr_1fr] sm:grid-cols-[1fr_3fr] sm:grid-rows-1 place-items-center p-1 sm:p-5 sm:gap-5";

/** Home page strip of categories on the Woo catalog; scrolls by touch, wheel or mouse drag. */
const CategorySlider = () => {
  const locale = useLocale() as Locale;
  const t = useTranslations("errorPage");
  const { data, isLoading, isError, refetch } = useGetCategoriesQuery(locale);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onMouseDown = (e: MouseEvent) => {
    if (!ref.current) return;
    drag.current = { x: e.clientX, scroll: ref.current.scrollLeft, moved: false };
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!drag.current || !ref.current) return;
    const walk = e.clientX - drag.current.x;
    if (!drag.current.moved && Math.abs(walk) < DRAG_THRESHOLD) return;
    e.preventDefault();
    drag.current.moved = true;
    setDragging(true);
    ref.current.scrollLeft = drag.current.scroll - walk;
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };
  // A drag that ends on a card must not also follow its link. Read the ref, not `dragging`:
  // the click can arrive before the re-render from the last mousemove.
  const onClickCapture = (e: MouseEvent) => {
    if (drag.current?.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3" role="alert">
        <p className="text-mainBlack/70">{t("title")}</p>
        <Button className="bg-mainPink text-mainWhite" onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  const categories = featuredCategories(data);
  if (!isLoading && categories.length === 0) return null;

  return (
    <div
      ref={ref}
      dir={locale === "ar" ? "rtl" : "ltr"}
      aria-busy={isLoading || undefined}
      data-testid="category-slider"
      className={`w-auto h-auto overflow-auto flex gap-3 md:gap-10 pb-5 select-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={() => setTimeout(endDrag)}
      onMouseLeave={endDrag}
      onClickCapture={onClickCapture}
    >
      {isLoading
        ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <Skeleton key={i} className={`${cardClass} aspect-[3/1] rounded-none`} />
          ))
        : categories.map((cat) => <CategoryCard key={cat.id} category={cat} />)}
    </div>
  );
};

const CategoryCard = ({ category }: { category: Category }) => (
  <Link href={`/categories/${category.slug}`} className={cardClass} draggable={false}>
    <div className="w-full aspect-square grid place-items-center">
      {category.image ? (
        <Image
          src={category.image.src}
          alt={category.image.alt || category.title}
          draggable={false}
          radius="none"
          className="w-full h-full object-contain p-2 sm:p-0"
        />
      ) : (
        <div className="w-full h-full bg-mainGray" data-testid="category-image-empty" />
      )}
    </div>
    <h2 className="text-lg sm:text-3xl capitalize text-center sm:text-start">{category.title}</h2>
  </Link>
);

export default CategorySlider;
