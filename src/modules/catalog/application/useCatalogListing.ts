"use client";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Locale } from "@/shared/kernel/Locale";
import { useGetProductsQuery } from "./catalogApi";
import { legacyParamsToArgs } from "./legacyUrl";

/**
 * Product listing driven by the URL (legacy filter params + category route segment).
 * The page lives in local state and returns to 1 whenever any filter changes.
 */
export function useCatalogListing(locale: Locale) {
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const rawCategory = routeParams?.name;
  const category = typeof rawCategory === "string" ? safeDecode(rawCategory) : null;

  const filters = useMemo(
    () => legacyParamsToArgs(searchParams, { locale, category }),
    [searchParams, locale, category]
  );
  const filtersKey = JSON.stringify(filters);

  const [pageState, setPageState] = useState({ key: filtersKey, page: 1 });
  const page = pageState.key === filtersKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ key: filtersKey, page: next });

  const args = useMemo(() => ({ ...filters, page }), [filters, page]);
  const query = useGetProductsQuery(args);

  return { args, filtersKey, page, setPage, ...query };
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
