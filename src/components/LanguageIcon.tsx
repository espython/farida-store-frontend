/* eslint-disable @next/next/no-img-element */
"use client";
import React from "react";
import Icon from "./Icon";
import { Avatar, Image, Select, SelectItem, Switch } from "@nextui-org/react";
import { useLocale } from "next-intl";

// import { useRouter, usePathname } from "@/navigation";
import "/node_modules/flag-icons/css/flag-icons.min.css";
import { usePathname, useRouter } from "next/navigation";

const LanguageIcon = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const changeLocale = (locale: string) => {
    if (!pathname) return "/";
    const url = new URL(window.location.href);
    const newUrl = new URL(url.href);

    // Update the language segment of the pathname
    const segments = newUrl.pathname.split("/");
    segments[1] = locale;
    newUrl.pathname = segments.join("/");

    // Preserve the existing search parameters
    newUrl.search = url.search;

    router.push(newUrl.href);
  };

  return (
    <div>



      <button
        type="button"
        lang={locale === "en" ? "ar" : "en"}
        aria-label={locale === "en" ? "العربية" : "English"}
        onClick={() => changeLocale(locale === "en" ? "ar" : "en")}
        className="w-11 h-11 grid place-items-center rounded-full bg-white hover:bg-sand transition-colors text-garden font-bold text-base select-none"
      >
        {locale === "en" ? "ع" : "EN"}
      </button>
    </div>
  );
};

export default LanguageIcon;
