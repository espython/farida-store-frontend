import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import React from "react";

const EmptyCartDrop = () => {
  const t = useTranslations("cartDrop");
  return (
    <div className="flex flex-col gap-2 py-4">
      <p className="text-garden-muted">{t("empty")}</p>
      <Link href={"/"} className="font-bold underline underline-offset-4 hover:text-saffron-ink">
        {t("continue")} <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
      </Link>
    </div>
  );
};

export default EmptyCartDrop;
