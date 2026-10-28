"use client";
import { useEffect, useState } from "react";
import type { Locale } from "@/shared/kernel/Locale";
import { useSearchProductsQuery } from "./catalogApi";

/** The search route rejects shorter terms. */
export const QUICK_SEARCH_MIN = 2;
export const QUICK_SEARCH_SIZE = 4;
const QUICK_SEARCH_DELAY_MS = 300;

/** Normalizes a typed term the way the search route will see it. */
export const quickSearchTerm = (raw: string) => raw.trim().slice(0, 100);

/**
 * Search-as-you-type for the search overlay: debounced, skipped below the minimum
 * length, first page only. `pending` covers both the debounce wait and the request.
 */
export function useQuickSearch(raw: string, locale: Locale) {
  const term = quickSearchTerm(raw);
  const [debounced, setDebounced] = useState(term);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), QUICK_SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [term]);

  const active = term.length >= QUICK_SEARCH_MIN;
  const skip = !active || debounced.length < QUICK_SEARCH_MIN;
  const { data, isFetching, isError, refetch } = useSearchProductsQuery(
    { locale, q: debounced, perPage: QUICK_SEARCH_SIZE },
    { skip }
  );

  const settled = !skip && debounced === term && !isFetching;
  return {
    term,
    active,
    pending: active && !settled && !isError,
    items: active && settled ? data?.items ?? [] : [],
    isError: active && isError,
    refetch,
  };
}
