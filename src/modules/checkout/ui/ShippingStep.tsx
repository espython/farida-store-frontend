"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useCheckout } from "../application/useCheckout";
import AddressForm from "@/shared/ui/AddressForm";
import CheckoutSummary, { summaryLines } from "./CheckoutSummary";
import { CheckoutEmpty, CheckoutLoading, CheckoutSignIn, CheckoutUnavailable } from "./CheckoutStates";

/** Step 2: delivery address (prefilled from the customer's last order). */
const ShippingStep = () => {
  const t = useTranslations("checkout");
  const router = useRouter();
  const c = useCheckout();

  if (c.loading) return <CheckoutLoading />;
  if (!c.signedIn) return <CheckoutSignIn />;
  if (c.loadFailed || !c.checkout) return <CheckoutUnavailable retry={() => window.location.reload()} />;
  if (c.checkout.lines.length === 0) return <CheckoutEmpty />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      <section aria-labelledby="delivery-title" className="lg:col-span-7 bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-5">
        <h2 id="delivery-title" className="font-display text-2xl md:text-[2rem]">
          {t("delivery.title")}
        </h2>
        <AddressForm
          initial={c.checkout.address}
          busy={c.busy}
          submitLabel={t("delivery.continue")}
          onSubmit={async (address) => {
            const r = await c.saveAddress(address);
            if (r.ok) {
              router.push("/cart/payment");
              return r;
            }
            const { code, fields } = r.failure;
            return { ok: false, fields, message: code === "invalid_address" ? undefined : t(`errors.${code}`) };
          }}
        />
      </section>
      <div className="lg:col-span-5 lg:sticky lg:top-24">
        <CheckoutSummary lines={summaryLines(c.checkout.lines)} totals={c.checkout.totals} />
      </div>
    </div>
  );
};

export default ShippingStep;
