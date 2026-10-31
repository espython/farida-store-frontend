"use client";
import { useTranslations } from "next-intl";
import { Money } from "@/shared/kernel/Money";
import type { CartTotals } from "../domain/cart";

/** Subtotal, sale savings and total. Shipping is settled at checkout (C3). */
const CartSummary = ({ totals, compact = false }: { totals: CartTotals; compact?: boolean }) => {
  const t = useTranslations("cart");
  const currency = useTranslations("currency");
  const amount = (m: typeof totals.subtotal, strong = false) => (
    <span className={strong ? "text-xl font-bold" : "font-semibold"}>
      {Money.toDisplay(m)} <span className="text-sm">{currency("currency")}</span>
    </span>
  );
  const row = "flex justify-between items-baseline gap-3";

  return (
    <dl className="flex flex-col gap-2">
      {!compact && (
        <div className={row}>
          <dt className="text-garden-muted">{t("subtotal", { count: totals.itemCount })}</dt>
          <dd>{amount(totals.subtotal)}</dd>
        </div>
      )}
      {!compact && totals.savings.amount > 0 && (
        <div className={row}>
          <dt className="text-garden-muted">{t("savings")}</dt>
          <dd className="text-saffron-ink font-semibold">
            −{Money.toDisplay(totals.savings)} <span className="text-sm">{currency("currency")}</span>
          </dd>
        </div>
      )}
      {!compact && (
        <div className={row}>
          <dt className="text-garden-muted">{t("shipping")}</dt>
          <dd className="text-sm text-garden-muted">{t("shippingAtCheckout")}</dd>
        </div>
      )}
      <div className={`${row} ${compact ? "" : "pt-3 mt-1 border-t border-line"}`}>
        <dt className="font-bold">{t("total")}</dt>
        <dd>{amount(totals.subtotal, true)}</dd>
      </div>
    </dl>
  );
};

export default CartSummary;
