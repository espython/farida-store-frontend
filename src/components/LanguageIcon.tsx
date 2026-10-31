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
      {/* <Select
        defaultSelectedKeys={[locale]}
        radius="sm"
        className="w-32 "
        size="sm"
        aria-label="language selection"
        onChange={(e) => {
          changeLocale(e.target.value);
        }}
        // classNames={{
        //   listboxWrapper: "bg-transparent",
        //   base: "bg-transparent",
        //   innerWrapper: "bg-transparent",
        //   listbox: "bg-transparent",
        //   mainWrapper: "bg-transparent",
        //   helperWrapper: "bg-transparent",
        //   popoverContent: "bg-transparent",
        // }}
      >
        <SelectItem
          key="en"
          startContent={
            <Avatar
              alt="en"
              className="w-6 h-6 "
              src="https://flagcdn.com/us.svg"
            />
          }
        >
          English
        </SelectItem>
        <SelectItem
          key="ar"
          startContent={
            <Avatar
              alt="arabic"
              className="w-6 h-6"
              src="https://flagcdn.com/eg.svg"
            />
          }
        >
          العربية
        </SelectItem>
      </Select> */}

      {/* <select
        defaultValue={locale}
        onChange={(e) => {
          changeLocale(e.target.value);
        }}
        className="cursor-pointer border-2 border-mainGray border-solid p-2"
      >
        <option value={"en"}>
          <div className="flex gap-5 items-center">
       
            <h1>English</h1>
          </div>
        </option>
        <option value={"ar"}>
          <div className="flex gap-5 items-center">
         
            <h1>العربية</h1>
          </div>
        </option>
      </select>  */}

      {/* <Switch
        size="lg"
        startContent={<div className="text-xl font-black">EN</div>}
        endContent={<div className="text-xl font-black">عربي</div>}
      >
        {" "}
      </Switch> */}

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
