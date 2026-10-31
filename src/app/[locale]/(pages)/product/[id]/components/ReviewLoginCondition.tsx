import { useTranslations } from "next-intl";
import React from "react";
import { Link } from "@/navigation";

/** Shown under the reviews to visitors who are not signed in. */
const ReviewLoginCondition = () => {
  const t = useTranslations("productPage");
  const login = useTranslations("loginForm");

  return (
    <div className="mt-8 p-5 rounded-2xl bg-white flex flex-wrap items-center justify-between gap-3">
      <p className="text-garden-muted">{t("reviewCondition")}</p>
      <Link href="/login" className="font-bold underline underline-offset-4 capitalize hover:text-saffron-ink">
        {login("login")}
      </Link>
    </div>
  );
};

export default ReviewLoginCondition;
