"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { LuCompass } from "react-icons/lu";
import PageContainer from "@/shared/ui/PageContainer";
import EmptyState from "@/shared/ui/EmptyState";
import Button, { buttonClass } from "@/shared/ui/Button";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <PageContainer className="py-12 md:py-16">
      <EmptyState
        icon={<LuCompass />}
        title={
          <>
            <span className="block font-display text-5xl md:text-6xl text-saffron-ink mb-2" aria-hidden="true">
              404
            </span>
            <span className="block">{t("title")}</span>
          </>
        }
        text={t("description")}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className={buttonClass()}>
              {t("goHome")}
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              {t("goBack")}
            </Button>
          </div>
        }
      />
    </PageContainer>
  );
}
