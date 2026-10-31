"use client";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { LuX } from "react-icons/lu";
import { Money } from "@/shared/kernel/Money";
import Button from "@/shared/ui/Button";
import type { AppliedCoupon } from "../domain/Checkout";
import type { StepResult } from "../application/useCheckout";

/** Apply or remove coupon codes; Woo decides whether a code is usable. */
const CouponBox = ({
  coupons,
  busy,
  onApply,
  onRemove,
}: {
  coupons: AppliedCoupon[];
  busy: boolean;
  onApply: (code: string) => Promise<StepResult>;
  onRemove: (code: string) => Promise<StepResult>;
}) => {
  const t = useTranslations("checkout");
  const currency = useTranslations("currency");
  const id = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    if (!code.trim()) return;
    setError(null);
    const r = await onApply(code);
    if (r.ok) setCode("");
    else setError(t(r.failure.code === "coupon_invalid" ? "errors.coupon_invalid" : "errors.unavailable"));
  };

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id} className="text-sm font-semibold">
        {t("coupon.label")}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
          dir="ltr"
          autoCapitalize="characters"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-11 flex-1 min-w-0 rounded-full bg-white border px-4 uppercase outline-none focus:border-garden focus:ring-2 focus:ring-garden/20 ${error ? "border-[#b42318]" : "border-line"}`}
        />
        <Button variant="outline" onClick={apply} disabled={busy || !code.trim()}>
          {t("coupon.apply")}
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-[#b42318]">
          {error}
        </p>
      )}
      {coupons.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {coupons.map((c) => (
            <li key={c.code} className="inline-flex items-center gap-2 ps-3 pe-1 py-1 rounded-full bg-sand text-sm font-bold">
              <span dir="ltr">{c.code.toUpperCase()}</span>
              <span className="text-saffron-ink">
                −{Money.toDisplay(c.discount)} {currency("currency")}
              </span>
              <button
                type="button"
                onClick={() => onRemove(c.code)}
                disabled={busy}
                aria-label={t("coupon.remove", { code: c.code.toUpperCase() })}
                className="w-8 h-8 grid place-items-center rounded-full hover:bg-white"
              >
                <LuX aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CouponBox;
