"use client";
import { Input } from "@nextui-org/react";
import { SearchIcon } from "lucide-react";
import { Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/navigation";
import React, { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { QuickSearch } from "@/modules/catalog";
import { useDrawer, useSearchQuery } from "@/store/ui";

const SearchBox = () => {
  const searchBox = useDrawer("search");
  const searchQuery = useSearchQuery();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const t = useTranslations("search");
  const inputRef = useRef<HTMLInputElement>(null);

  // Put the caret in the field whenever the overlay opens.
  useEffect(() => {
    if (searchBox.open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [searchBox.open]);

  const closeSearch = () => {
    searchBox.hide();
    searchQuery.setQuery("");
  };

  const searchForResult = (query: string) => {
    // The localized router adds the locale prefix itself.
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    closeSearch();
  };

  useEffect(() => {
    const clickingEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && searchQuery.query.length > 0) {
        e.preventDefault();

        searchForResult(searchQuery.query);
      }
    };

    if (searchBox.open === true) {
      window.addEventListener("keydown", clickingEnter);
    } else {
      window.removeEventListener("keydown", clickingEnter);
    }

    return () => window.removeEventListener("keydown", clickingEnter);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery.query, searchBox.open]);

  return (
    <div className="w-full flex flex-col gap-5 items-center justify-center">
      <Input
        ref={inputRef}
        type="search"
        aria-label={t("search")}
        radius="full"
        size="lg"
        value={searchQuery.query}
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
                if (searchQuery.query.length > 0) {
                  searchForResult(searchQuery.query);
                }
              }}
            >
              <SearchIcon className="text-cream" aria-hidden="true" />
            </button>
        }
        className="w-full"
        onChange={(e) => {
          searchQuery.setQuery(e.target.value);
        }}
      />

      <div className="w-full">
        <QuickSearch term={searchQuery.query} onPick={closeSearch} onShowAll={searchForResult} />
      </div>
    </div>
  );
};

export default SearchBox;
