import { useTranslations } from "next-intl";
import React from "react";
import { FaCheck } from "react-icons/fa";

const ReviewSendedSuccesfuly = () => {
  const t = useTranslations("productPage");
  return (
    <div role="status" className="mt-8 p-4 rounded-2xl bg-[#dcebe0] flex gap-3 items-center">
      <FaCheck aria-hidden="true" />
      <p>{t("successRating")}</p>
    </div>
  );
};

export default ReviewSendedSuccesfuly;
