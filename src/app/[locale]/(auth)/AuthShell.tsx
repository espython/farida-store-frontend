import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import PageContainer from "@/shared/ui/PageContainer";

const PERKS = ["orders", "addresses", "wishlist"] as const;

/** Login / register layout: brand panel beside the form on desktop, form only on phone. */
const AuthShell = ({ title, children }: { title: string; children: ReactNode }) => {
  const t = useTranslations("auth");

  return (
    <PageContainer className="py-6 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
        <aside className="hidden lg:flex flex-col justify-between gap-8 p-10 rounded-3xl bg-garden text-cream">
          <div className="flex flex-col gap-4">
            <p className="font-display text-[2.75rem] leading-tight">{t("panelTitle")}</p>
            <p className="text-cream/80 text-[1.0625rem]">{t("panelText")}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {PERKS.map((key) => (
              <li key={key} className="flex items-center gap-3">
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-saffron shrink-0" />
                {t(`perks.${key}`)}
              </li>
            ))}
          </ul>
        </aside>
        <section aria-labelledby="auth-title" className="bg-white rounded-3xl p-5 md:p-10 flex flex-col gap-6">
          <h1 id="auth-title" className="font-display text-[1.75rem] md:text-[2rem] leading-tight">
            {title}
          </h1>
          {children}
        </section>
      </div>
    </PageContainer>
  );
};

export default AuthShell;
