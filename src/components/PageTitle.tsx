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
    <div
      className="pt-5  flex flex-col justify-center items-center gap-5 "
      dir={locale === "en" ? "ltr" : "rtl"}
    >
      <Breadcrumbs>
        <BreadcrumbItem
          href="/"
          classNames={{ separator: locale === "ar" && "rotate-180" }}
        >
          {t("home")}
        </BreadcrumbItem>
        <BreadcrumbItem
          className="capitalize"
          classNames={{ separator: locale === "ar" && "rotate-180" }}
        >
          {title}
        </BreadcrumbItem>
      </Breadcrumbs>
      <h1 className="text-center font-display text-3xl md:text-[2.75rem] leading-tight font-medium capitalize">
        {title}
      </h1>
    </div>
  );
};

export default PageTitle;
