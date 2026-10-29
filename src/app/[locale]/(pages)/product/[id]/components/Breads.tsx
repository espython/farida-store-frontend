"use client";
import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";

interface breadProps {
  title?: string;
}

const Breads = ({ title }: breadProps) => {
  const t = useTranslations("productPage");
  const locale = useLocale();

  return (
    <Breadcrumbs
      size="sm"
      classNames={{ list: "flex-wrap" }}
      itemClasses={{
        item: "text-garden-muted data-[current=true]:text-garden data-[current=true]:font-semibold",
        separator: `text-garden-muted ${locale === "ar" ? "rotate-180" : ""}`,
      }}
    >
      <BreadcrumbItem href={`/${locale}`} className="capitalize">
        {t("breads.home")}
      </BreadcrumbItem>
      <BreadcrumbItem href={`/${locale}`} className="capitalize">
        {t("breads.product")}
      </BreadcrumbItem>
      <BreadcrumbItem className="line-clamp-1">{title}</BreadcrumbItem>
    </Breadcrumbs>
  );
};

export default Breads;
