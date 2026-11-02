"use client";
import { CircularProgress } from "@nextui-org/react";
import React from "react";
import { useTranslations } from "next-intl";

interface loadingOverlayProps {
  activateLoading?: boolean;
}

const LoadingOverlay = ({ activateLoading = true }: loadingOverlayProps) => {
  const t = useTranslations("loading");
  return (
    <div className="absolute inset-0 z-50 bg-cream/60 flex justify-center items-center" aria-busy="true">
      {activateLoading && (
        <CircularProgress
          aria-label={t("label")}
          size="lg"
          classNames={{ indicator: "stroke-garden", track: "stroke-garden/10" }}
        />
      )}
    </div>
  );
};

export default LoadingOverlay;
