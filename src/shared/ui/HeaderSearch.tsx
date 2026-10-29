"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";

interface Props {
  id: string;
  className?: string;
}

/** Always-visible search field of the Kitchen Garden header; submits to the search page. */
const HeaderSearch = ({ id, className = "" }: Props) => {
  const t = useTranslations("header");
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className={`flex items-center gap-2.5 h-12 px-4 bg-white border border-line rounded-full focus-within:border-garden ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <label htmlFor={id} className="sr-only">
        {t("searchLabel")}
      </label>
      <input
        id={id}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="flex-1 min-w-0 bg-transparent text-base outline-none placeholder:text-garden-muted"
      />
    </form>
  );
};

export default HeaderSearch;
