"use client";
import { CircularProgress } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import React from "react";

interface loadingOverlayProps {
  activateLoading?: boolean;
}

const LoadingOverlay = ({ activateLoading = true }: loadingOverlayProps) => {
  return (
    <div className="absolute inset-0 z-50 bg-cream/60 flex justify-center items-center" aria-busy="true">
      {activateLoading && (
        <CircularProgress
          aria-label="Loading"
          size="lg"
          classNames={{ indicator: "stroke-garden", track: "stroke-garden/10" }}
        />
      )}
    </div>
  );
};

export default LoadingOverlay;
