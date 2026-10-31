import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import { useTranslations } from "next-intl";
import React from "react";
import { LuCheck } from "react-icons/lu";

const Thanks = ({ orderId }: { orderId: string }) => {
  const t = useTranslations("confirmationPage");

  return (
    <section
      aria-labelledby="order-thanks"
      className="flex flex-col items-center text-center gap-3 px-6 py-10 md:py-12 bg-white rounded-3xl"
    >
      <span className="w-16 h-16 grid place-items-center rounded-full bg-garden text-cream text-3xl" aria-hidden="true">
        <LuCheck />
      </span>
      <h2 id="order-thanks" className="font-display text-[1.75rem] md:text-[2.75rem] leading-tight first-letter:uppercase">
        {t("thanks.thank")}
      </h2>
      <p className="text-garden-muted max-w-md first-letter:uppercase">{t("thanks.message")}</p>
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        <Link href={`/trackorder/${orderId}`} className={buttonClass()}>
          {t("thanks.track")}
        </Link>
        <Link href="/" className={buttonClass({ variant: "outline" })}>
          {t("thanks.continue")}
        </Link>
      </div>
    </section>
  );
};

export default Thanks;
