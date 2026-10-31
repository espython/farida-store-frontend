"use client";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import TextField from "@/shared/ui/TextField";
import Button from "@/shared/ui/Button";
import { validateAddress, type Address } from "../domain/Address";
import { GOVERNORATES } from "@/shared/kernel/Governorate";
import type { CheckoutFailure } from "../application/checkoutFailure";

interface Props {
  initial: Address;
  busy: boolean;
  onSubmit: (address: Address) => Promise<{ ok: true } | { ok: false; failure: CheckoutFailure }>;
  submitLabel: string;
}

/** Delivery address; Egypt only. Rules from the checkout domain, checked again by the BFF. */
const CheckoutAddressForm = ({ initial, busy, onSubmit, submitLabel }: Props) => {
  const t = useTranslations("checkout");
  const locale = useLocale() as "en" | "ar";
  const stateId = useId();
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<Address>({ defaultValues: initial });

  const rule = (field: keyof Address) => (value: string) => {
    const code = validateAddress({ ...getValues(), [field]: value })[field];
    return code ? t(`addressErrors.${code}`) : true;
  };
  const err = (f: keyof Address) => errors[f]?.message;

  const submit = handleSubmit(async (address) => {
    const result = await onSubmit(address);
    if (!result.ok) {
      for (const [field, code] of Object.entries(result.failure.fields)) {
        if (code) setError(field as keyof Address, { message: t(`addressErrors.${code}`) });
      }
      if (result.failure.code !== "invalid_address") setError("root", { message: t(`errors.${result.failure.code}`) });
    }
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField {...register("firstName", { validate: rule("firstName") })} autoComplete="given-name" label={t("fields.firstName")} error={err("firstName")} />
        <TextField {...register("lastName", { validate: rule("lastName") })} autoComplete="family-name" label={t("fields.lastName")} error={err("lastName")} />
      </div>
      <TextField
        {...register("phone", { validate: rule("phone") })}
        type="tel"
        inputMode="tel"
        dir="ltr"
        autoComplete="tel"
        label={t("fields.phone")}
        placeholder="01X XXXX XXXX"
        hint={t("fields.phoneHint")}
        error={err("phone")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={stateId} className="text-sm font-semibold">
            {t("fields.governorate")}
          </label>
          <select
            id={stateId}
            {...register("state", { validate: rule("state") })}
            aria-invalid={!!errors.state}
            aria-describedby={errors.state ? `${stateId}-error` : undefined}
            className={`h-12 w-full rounded-xl bg-white border px-4 text-base text-garden outline-none focus:border-garden focus:ring-2 focus:ring-garden/20 ${
              errors.state ? "border-[#b42318]" : "border-line"
            }`}
          >
            <option value="">{t("fields.chooseGovernorate")}</option>
            {GOVERNORATES.map((g) => (
              <option key={g.code} value={g.code}>
                {g[locale]}
              </option>
            ))}
          </select>
          {errors.state && (
            <p id={`${stateId}-error`} className="text-sm text-[#b42318]">
              {errors.state.message}
            </p>
          )}
        </div>
        <TextField {...register("city", { validate: rule("city") })} autoComplete="address-level2" label={t("fields.city")} error={err("city")} />
      </div>
      <TextField {...register("address1", { validate: rule("address1") })} autoComplete="address-line1" label={t("fields.address1")} placeholder={t("fields.address1Placeholder")} error={err("address1")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField {...register("address2", { validate: rule("address2") })} autoComplete="address-line2" label={t("fields.address2")} hint={t("fields.optional")} error={err("address2")} />
        <TextField {...register("postcode", { validate: rule("postcode") })} inputMode="numeric" autoComplete="postal-code" label={t("fields.postcode")} hint={t("fields.postcodeHint")} error={err("postcode")} />
      </div>
      {errors.root && (
        <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" size="lg" full disabled={busy} aria-busy={busy}>
        {busy && <Spinner size="sm" color="current" />}
        {submitLabel}
      </Button>
    </form>
  );
};

export default CheckoutAddressForm;
