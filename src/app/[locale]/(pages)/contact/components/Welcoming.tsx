import React from "react";
import Branch from "./Branch";
import { useTranslations } from "next-intl";

const Welcoming = () => {
  const t = useTranslations("contactPage");

  // One store until the owner sends the real branch list; this showed the
  // same placeholder branch three times.
  return (
    <section aria-labelledby="contact-visit" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <h2 id="contact-visit" className="font-display text-xl md:text-2xl">
        {t("branches.title")}
      </h2>
      <Branch
        city_State={t("branches.city_state")}
        phone="01089759963"
        times1={t("branches.times1")}
        times2={t("branches.times2")}
      />
    </section>
  );
};

export default Welcoming;
