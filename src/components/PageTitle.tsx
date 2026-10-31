"use client";
import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";

interface pageTitleProps {
  title: string;
}

const PageTitle = ({ title }: pageTitleProps) => {
  const t = useTranslations("pageTitle");
  const locale = useLocale();

  return (
    <div className="pt-4 md:pt-6 pb-2 flex flex-col items-center gap-2 md:gap-3" dir={locale === "en" ? "ltr" : "rtl"}>
      <Breadcrumbs
        size="sm"
        classNames={{ list: "flex-wrap justify-center" }}
        itemClasses={{
          item: "text-garden-muted data-[current=true]:text-garden data-[current=true]:font-semibold capitalize",
          separator: `text-garden-muted ${locale === "ar" ? "rotate-180" : ""}`,
        }}
      >
        <BreadcrumbItem href={`/${locale}`}>{t("home")}</BreadcrumbItem>
        <BreadcrumbItem>{title}</BreadcrumbItem>
      </Breadcrumbs>
      <h1 className="text-center font-display text-3xl md:text-[2.75rem] leading-tight font-medium capitalize">{title}</h1>
    </div>
  );
};

export default PageTitle;
