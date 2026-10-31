"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import { LuBanknote, LuCreditCard, LuMapPin } from "react-icons/lu";
import { Link, useRouter } from "@/navigation";
import { Money } from "@/shared/kernel/Money";
import Button, { buttonClass } from "@/shared/ui/Button";
import TextField from "@/shared/ui/TextField";
import { isAddressComplete } from "../domain/Address";
import { canPlaceOrder, selectedRate, type PaymentMethod } from "../domain/Checkout";
import { governorateName } from "@/shared/kernel/Governorate";
import { useCheckout } from "../application/useCheckout";
import CheckoutSummary, { summaryLines } from "./CheckoutSummary";
import ChoiceCards from "./ChoiceCards";
import CouponBox from "./CouponBox";
import { CheckoutEmpty, CheckoutLoading, CheckoutSignIn, CheckoutUnavailable } from "./CheckoutStates";

const NOTE_MAX = 500;

/** Step 3: shipping rate, payment method, coupon, note, place the order. */
const PaymentStep = () => {
  const t = useTranslations("checkout");
  const currency = useTranslations("currency");
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const c = useCheckout();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const checkout = c.checkout;
  const addressOk = checkout ? isAddressComplete(checkout.address) : false;

  // Default to the first method the shop offers.
  useEffect(() => {
    if (checkout && (!method || !checkout.paymentMethods.includes(method))) setMethod(checkout.paymentMethods[0] ?? null);
  }, [checkout, method]);

  if (c.loading) return <CheckoutLoading />;
  if (!c.signedIn) return <CheckoutSignIn />;
  if (c.loadFailed || !checkout) return <CheckoutUnavailable retry={() => window.location.reload()} />;
  if (checkout.lines.length === 0) return <CheckoutEmpty />;
  if (!addressOk) {
    return (
      <div className="bg-white rounded-3xl p-6 flex flex-col items-start gap-4">
        <p>{t("payment.needAddress")}</p>
        <Link href="/cart/shipping" className={buttonClass()}>
          {t("payment.addAddress")}
        </Link>
      </div>
    );
  }

  const rate = selectedRate(checkout);
  const ready = canPlaceOrder(checkout, addressOk) && method !== null;
  const a = checkout.address;

  const place = async () => {
    if (!method) return;
    setError(null);
    const r = await c.placeOrder(method, note.trim());
    if (r.ok) router.push(`/cart/confirmation?order=${r.orderId}`);
    else setError(t(`errors.${r.failure.code}`));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      <div className="lg:col-span-7 flex flex-col gap-5">
        <section aria-labelledby="deliver-to" className="bg-white rounded-3xl p-5 md:p-6 flex items-start gap-4">
          <span className="w-11 h-11 shrink-0 grid place-items-center rounded-full bg-sand text-xl" aria-hidden="true">
            <LuMapPin />
          </span>
          <div className="flex-1 min-w-0">
            <h2 id="deliver-to" className="font-bold">
              {t("payment.deliverTo")}
            </h2>
            <p className="text-garden-muted">
              {a.firstName} {a.lastName} · <bdi dir="ltr">{a.phone}</bdi>
            </p>
            <p className="text-garden-muted">
              <bdi>
                {[a.address1, a.address2, a.city].filter(Boolean).join(locale === "ar" ? "، " : ", ")}
              </bdi>
              {" — "}
              {governorateName(a.state, locale)}
            </p>
          </div>
          <Link href="/cart/shipping" className={`${buttonClass({ variant: "ghost" })} shrink-0`}>
            {t("payment.change")}
          </Link>
        </section>

        <section className="bg-white rounded-3xl p-5 md:p-6">
          {checkout.shippingRates.length === 0 ? (
            <p role="alert">{t("payment.noShipping")}</p>
          ) : (
            <ChoiceCards
              legend={t("payment.shipping")}
              name="shipping-rate"
              value={rate?.id ?? null}
              disabled={c.busy || c.placing}
              onChange={(id) => void c.chooseRate(id)}
              options={checkout.shippingRates.map((r) => ({
                value: r.id,
                title: r.name,
                aside: r.price.amount === 0 ? t("payment.free") : `${Money.toDisplay(r.price)} ${currency("currency")}`,
              }))}
            />
          )}
        </section>

        <section className="bg-white rounded-3xl p-5 md:p-6">
          <ChoiceCards
            legend={t("payment.method")}
            name="payment-method"
            value={method}
            disabled={c.placing}
            onChange={setMethod}
            options={checkout.paymentMethods.map((m) => ({
              value: m,
              icon: m === "cod" ? <LuBanknote /> : <LuCreditCard />,
              title: t(`payment.methods.${m}.title`),
              text: t(`payment.methods.${m}.text`),
            }))}
          />
        </section>

        <section className="bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-5">
          <CouponBox coupons={checkout.coupons} busy={c.busy || c.placing} onApply={c.applyCoupon} onRemove={c.removeCoupon} />
          <TextField
            multiline
            rows={3}
            maxLength={NOTE_MAX}
            label={t("payment.note")}
            hint={t("payment.noteHint")}
            value={note}
            onChange={(e) => setNote((e.target as HTMLTextAreaElement).value)}
          />
        </section>
      </div>

      <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col gap-4">
        <CheckoutSummary lines={summaryLines(checkout.lines)} totals={checkout.totals} />
        {error && (
          <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
            {error}{" "}
            {error === t("errors.out_of_stock") && (
              <Link href="/cart" className="font-bold underline">
                {t("payment.reviewCart")}
              </Link>
            )}
            {error === t("errors.invalid_address") && (
              <Link href="/cart/shipping" className="font-bold underline">
                {t("payment.change")}
              </Link>
            )}
          </p>
        )}
        <Button size="lg" full disabled={!ready || c.busy || c.placing} aria-busy={c.placing} onClick={place}>
          {c.placing && <Spinner size="sm" color="current" />}
          {t("payment.place", { total: `${Money.toDisplay(checkout.totals.total)} ${currency("currency")}` })}
        </Button>
      </div>
    </div>
  );
};

export default PaymentStep;
