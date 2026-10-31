"use client";

import { Spinner } from "@nextui-org/react";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("loading");

  return (
    <div role="status" aria-busy="true" className="flex min-h-[50vh] items-center justify-center text-garden">
      <Spinner size="lg" color="current" aria-label={t("label")} />
    </div>
  );
}
