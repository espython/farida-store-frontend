"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { Input } from "@nextui-org/react";
import { SearchIcon } from "lucide-react";
import { Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/navigation";
import React, { useContext, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { QuickSearch } from "@/modules/catalog";

const SearchBox = () => {
  const { searchBox } = useContext(StoreContext);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const t = useTranslations("search");
  const inputRef = useRef<HTMLInputElement>(null);

  // Put the caret in the field whenever the overlay opens.
  useEffect(() => {
    if (searchBox.showSearchBox) setTimeout(() => inputRef.current?.focus(), 300);
  }, [searchBox.showSearchBox]);

  const closeSearch = () => {
    searchBox.hideWholeSearchBox();
    searchBox.setSearchInputValue("");
  };

  const searchForResult = (query: string) => {
    // The localized router adds the locale prefix itself.
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    closeSearch();
  };

  useEffect(() => {
    const clickingEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && searchBox.searchInputValue.length > 0) {
        e.preventDefault();

        searchForResult(searchBox.searchInputValue);
      }
    };

    if (searchBox.showSearchBox === true) {
      window.addEventListener("keydown", clickingEnter);
    } else {
      window.removeEventListener("keydown", clickingEnter);
    }

    return () => window.removeEventListener("keydown", clickingEnter);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchBox.searchInputValue, searchBox.showSearchBox]);

  return (
    <div className="w-full flex flex-col gap-5 items-center justify-center">
      <Input
        ref={inputRef}
        type="search"
        aria-label={t("search")}
        radius="full"
        size="lg"
        value={searchBox.searchInputValue}
        placeholder={query ? query : t("type")}
        classNames={{
          inputWrapper: "h-14 bg-white border border-line shadow-none data-[hover=true]:bg-white group-data-[focus=true]:bg-white group-data-[focus=true]:border-garden",
          input: "text-base text-garden placeholder:text-garden-muted",
        }}
        endContent={
          <button
              type="button"
              aria-label={t("search")}
              className="w-11 h-11 -me-2 grid place-items-center rounded-full bg-garden text-cream"
              onClick={() => {
                if (searchBox.searchInputValue.length > 0) {
                  searchForResult(searchBox.searchInputValue);
                }
              }}
            >
              <SearchIcon className="text-cream" aria-hidden="true" />
            </button>
        }
        className="w-full"
        onChange={(e) => {
          searchBox.setSearchInputValue(e.target.value);
        }}
      />

      <div className="w-full">
        <QuickSearch term={searchBox.searchInputValue} onPick={closeSearch} onShowAll={searchForResult} />
      </div>
    </div>
  );
};

export default observer(SearchBox);
