"use client";
import { Image } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { Money } from "@/shared/kernel/Money";
import type { CartLine } from "@/modules/cart";
import type { CheckoutTotals } from "../domain/Checkout";

/** Lines and Woo's totals (shipping and coupons included). */
const CheckoutSummary = ({ lines, totals }: { lines: { key: string; title: string; quantity: number; total: Money; image: string | null }[]; totals: CheckoutTotals }) => {
  const t = useTranslations("checkout");
  const currency = useTranslations("currency");
  const amount = (m: Money) => (
    <>
      {Money.toDisplay(m)} <span className="text-sm">{currency("currency")}</span>
    </>
  );
  const row = "flex justify-between items-baseline gap-3";
  return (
    <section aria-labelledby="checkout-summary" className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <h2 id="checkout-summary" className="font-display text-xl md:text-2xl">
        {t("summary.title")}
      </h2>
      <ul className="divide-y divide-line">
        {lines.map((l) => (
          <li key={l.key} className="py-3 grid grid-cols-[3.5rem_1fr_auto] gap-3 items-center">
            <span className="w-14 aspect-square rounded-xl overflow-hidden bg-sand">
              {l.image && <Image src={l.image} alt="" radius="none" removeWrapper className="w-full h-full object-cover" />}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold leading-snug line-clamp-2">{l.title}</span>
              <span className="text-sm text-garden-muted">× {l.quantity}</span>
            </span>
            <span className="font-bold whitespace-nowrap">{amount(l.total)}</span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 pt-4 border-t border-line">
        <div className={row}>
          <dt className="text-garden-muted">{t("summary.items")}</dt>
          <dd className="font-semibold">{amount(totals.items)}</dd>
        </div>
        <div className={row}>
          <dt className="text-garden-muted">{t("summary.shipping")}</dt>
          <dd className="font-semibold">{totals.shipping.amount > 0 ? amount(totals.shipping) : t("summary.shippingTbd")}</dd>
        </div>
        {totals.discount.amount > 0 && (
          <div className={row}>
            <dt className="text-garden-muted">{t("summary.discount")}</dt>
            <dd className="font-semibold text-saffron-ink">−{amount(totals.discount)}</dd>
          </div>
        )}
        <div className={`${row} pt-3 mt-1 border-t border-line`}>
          <dt className="font-bold">{t("summary.total")}</dt>
          <dd className="text-xl font-bold">{amount(totals.total)}</dd>
        </div>
      </dl>
    </section>
  );
};

/** Cart lines → summary rows. */
export const summaryLines = (lines: CartLine[]) =>
  lines.map((l) => ({
    key: l.product.id,
    title: l.product.title,
    quantity: l.quantity,
    total: Money.multiply(l.product.unitPrice, l.quantity),
    image: l.product.image,
  }));

export default CheckoutSummary;
