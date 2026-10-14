"use client";

import { CircularProgress } from "@nextui-org/react";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("loading");

  return (
    <div
      role="status"
      aria-busy="true"
      className="flex min-h-[50vh] items-center justify-center"
    >
      <CircularProgress
        aria-label={t("label")}
        color="secondary"
        size="lg"
        classNames={{
          indicator: "stroke-mainPink",
          track: "stroke-mainPink/10",
        }}
      />
    </div>
  );
}
