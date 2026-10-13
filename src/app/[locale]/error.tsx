"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@nextui-org/react";
import { FaExclamationTriangle } from "react-icons/fa";
import { Link } from "@/navigation";

// Renders inside the locale layout, so the navbar/footer and the next-intl
// provider are still available. Errors thrown by the layout itself fall
// through to app/global-error.tsx.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center px-5"
    >
      <div className="space-y-6 text-center">
        <FaExclamationTriangle className="mx-auto text-6xl text-mainBlack/30 md:text-8xl" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-mainBlack/70 md:text-4xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-md text-sm text-mainBlack/50 md:text-lg">
            {t("description")}
          </p>
          {error.digest && (
            <p className="text-xs text-mainBlack/40">
              {t("reference")}: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            className="bg-mainBlack px-8 py-3 text-lg text-mainWhite"
            radius="sm"
            onClick={() => reset()}
          >
            {t("retry")}
          </Button>
          <Link href="/">
            <Button
              variant="bordered"
              className="border-mainBlack px-8 py-3 text-lg text-mainBlack"
              radius="sm"
            >
              {t("goHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
