"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { LuAlertTriangle } from "react-icons/lu";
import { Link } from "@/navigation";
import PageContainer from "@/shared/ui/PageContainer";
import EmptyState from "@/shared/ui/EmptyState";
import Button, { buttonClass } from "@/shared/ui/Button";

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
    <PageContainer className="py-12 md:py-16">
      <EmptyState
        role="alert"
        icon={<LuAlertTriangle />}
        title={<span className="block">{t("title")}</span>}
        text={
          <>
            {t("description")}
            {error.digest && (
              <span className="block mt-2 text-sm">
                {t("reference")}: <bdi className="font-mono">{error.digest}</bdi>
              </span>
            )}
          </>
        }
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => reset()}>{t("retry")}</Button>
            <Link href="/" className={buttonClass({ variant: "outline" })}>
              {t("goHome")}
            </Link>
          </div>
        }
      />
    </PageContainer>
  );
}
