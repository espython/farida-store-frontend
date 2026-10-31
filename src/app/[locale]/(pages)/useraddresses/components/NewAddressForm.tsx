"use client";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import React, { useContext } from "react";
import { FieldValues, useForm } from "react-hook-form";
import TextField from "@/shared/ui/TextField";
import Button from "@/shared/ui/Button";

const NewAddressForm = () => {
  const { userOrders, user, addressModal } = useContext(StoreContext);
  const t = useTranslations("userAdderesses");
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const submittingForm = (data: FieldValues) => {
    userOrders.setIsAddressLoading = true;

    const formattedData = {
      street: data.street,
      state: data.state,
      city: data.city,
      country: data.country,
      postal_code: data.postal_code,
      phone: data.phone,
      userId: user.strapiUserdata.id.toString(),
      second_phone: data.second_phone,
      fullname: user.strapiUserdata.username,
    };

    userOrders.addNewUserAddress(formattedData).finally(() => {
      userOrders.setIsAddressLoading = false;
      addressModal.onClose();
    });
  };

  // Required fields were only marked with NextUI's asterisk; nothing stopped
  // an empty submit. react-hook-form now blocks it and names the field.
  const required = { required: t("form.required") };
  const errorOf = (name: string) => errors[name]?.message as string | undefined;

  return (
    <div className="relative">
      {userOrders.isAddressLoading && <LoadingOverlay />}
      <form
        noValidate
        onSubmit={handleSubmit((data) => {
          submittingForm(data);
        })}
        className="flex flex-col gap-4"
      >
        <TextField
          {...register("street", required)}
          autoComplete="street-address"
          label={t("form.labels.street")}
          placeholder={t("form.placeholders.street")}
          error={errorOf("street")}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            {...register("city", required)}
            autoComplete="address-level2"
            label={t("form.labels.city")}
            placeholder={t("form.placeholders.city")}
            error={errorOf("city")}
          />
          <TextField
            {...register("state", required)}
            autoComplete="address-level1"
            label={t("form.labels.state")}
            placeholder={t("form.placeholders.state")}
            error={errorOf("state")}
          />
          <TextField
            {...register("country", required)}
            autoComplete="country-name"
            label={t("form.labels.country")}
            placeholder={t("form.placeholders.country")}
            error={errorOf("country")}
          />
          <TextField
            {...register("postal_code", required)}
            autoComplete="postal-code"
            inputMode="numeric"
            label={t("form.labels.postal")}
            placeholder={t("form.placeholders.postal")}
            error={errorOf("postal_code")}
          />
          <TextField
            {...register("phone", required)}
            type="tel"
            autoComplete="tel"
            label={t("form.labels.phone1")}
            placeholder={t("form.placeholders.phone1")}
            error={errorOf("phone")}
          />
          <TextField
            {...register("second_phone")}
            type="tel"
            label={t("form.labels.phone2")}
            placeholder={t("form.placeholders.phone2")}
            hint={t("form.optional")}
          />
        </div>
        <Button type="submit" size="lg" full className="mt-2" disabled={userOrders.isAddressLoading}>
          <span className="first-letter:uppercase">{t("form.action.submit")}</span>
        </Button>
      </form>
    </div>
  );
};

export default observer(NewAddressForm);
