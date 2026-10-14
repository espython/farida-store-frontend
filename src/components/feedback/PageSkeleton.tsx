"use client";

import { useTranslations } from "next-intl";

type Variant = "grid" | "list" | "detail";

// Neutral placeholder shown by route-level loading.tsx files.
// Client component: loading.tsx gets no `params`, so the locale has to come
// from the NextIntlClientProvider rather than from the request.
const Block = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-mainBlack/10 ${className}`} />
);

const PageSkeleton = ({ variant = "grid" }: { variant?: Variant }) => {
  const t = useTranslations("loading");

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t("label")}
      className="mx-auto w-full max-w-7xl px-5 py-8"
    >
      <span className="sr-only">{t("label")}</span>

      {variant === "grid" && (
        <>
          <Block className="mb-6 h-8 w-48" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Block className="aspect-square w-full" />
                <Block className="h-4 w-3/4" />
                <Block className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        </>
      )}

      {variant === "list" && (
        <>
          <Block className="mb-6 h-8 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Block className="h-24 w-24 shrink-0" />
                <div className="flex-1 space-y-3">
                  <Block className="h-4 w-2/3" />
                  <Block className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {variant === "detail" && (
        <div className="grid gap-8 md:grid-cols-2">
          <Block className="aspect-square w-full" />
          <div className="space-y-4">
            <Block className="h-8 w-3/4" />
            <Block className="h-6 w-1/4" />
            <Block className="h-4 w-full" />
            <Block className="h-4 w-full" />
            <Block className="h-4 w-2/3" />
            <Block className="mt-6 h-12 w-48" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PageSkeleton;
