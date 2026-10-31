"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";
import PageContainer from "@/shared/ui/PageContainer";

const STEPS = [
  { href: "/cart" },
  { href: "/cart/shipping" },
  { href: "/cart/payment" },
  { href: "/cart/confirmation" },
] as const;

/** Checkout stepper: numbered steps on desktop, "Step n of 4" with a bar on phones. */
const LayoutTabs = () => {
  const pathname = usePathname();
  const t = useTranslations("cartPage");
  const steps = useTranslations("checkoutSteps");
  const current = Math.max(
    0,
    STEPS.findIndex((s) => s.href === pathname)
  );
  // Each step label is looked up literally so the i18n verifier can check it.
  const titles = [t("tabs.step1.title"), t("tabs.step2.title"), t("tabs.step3.title"), t("tabs.step4.title")];
  const texts = [t("tabs.step1.description"), t("tabs.step2.description"), t("tabs.step3.description"), t("tabs.step4.description")];

  return (
    <PageContainer className="py-4">
      <nav aria-label={steps("label")}>
        <div className="md:hidden flex flex-col gap-2">
          <p className="text-sm font-semibold">
            {steps("progress", { current: current + 1, total: STEPS.length })} ·{" "}
            <span className="capitalize">{titles[current]}</span>
          </p>
          <div className="h-2 rounded-full bg-sand overflow-hidden">
            <div className="h-full bg-garden rounded-full transition-all" style={{ width: `${((current + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <ol className="hidden md:grid grid-cols-4 gap-2">
          {STEPS.map((step, i) => {
            const done = i < current;
            const active = i === current;
            const circle = (
              <span
                className={`w-10 h-10 shrink-0 grid place-items-center rounded-full font-bold ${
                  done ? "bg-garden text-cream" : active ? "bg-saffron text-garden" : "bg-white text-garden-muted border border-line"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
            );
            const label = (
              <span className="flex flex-col min-w-0">
                <span className={`capitalize font-semibold ${active ? "" : "text-garden-muted"}`}>{titles[i]}</span>
                <span className="text-sm text-garden-muted truncate first-letter:uppercase">{texts[i]}</span>
              </span>
            );
            return (
              <li key={step.href} aria-current={active ? "step" : undefined} className="relative flex items-center gap-3">
                {/* Earlier steps stay reachable; later ones only through the flow. */}
                {done && i < 2 ? (
                  <Link href={step.href} className="flex items-center gap-3 rounded-xl hover:text-saffron-ink">
                    {circle}
                    {label}
                  </Link>
                ) : (
                  <>
                    {circle}
                    {label}
                  </>
                )}
                {i < STEPS.length - 1 && <span aria-hidden="true" className={`hidden lg:block flex-1 h-0.5 ${done ? "bg-garden" : "bg-line"}`} />}
              </li>
            );
          })}
        </ol>
      </nav>
    </PageContainer>
  );
};

export default LayoutTabs;
