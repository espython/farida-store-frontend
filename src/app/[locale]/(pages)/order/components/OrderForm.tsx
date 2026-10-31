"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useRouter } from "@/navigation";
import React, { useContext, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import TextField from "@/shared/ui/TextField";
import Button from "@/shared/ui/Button";
import { LuPackageSearch } from "react-icons/lu";

const OrderForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { userOrders, user } = useContext(StoreContext);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("trackOrderPage");

  const goToOrder = (data: FieldValues) => {
    setIsLoading(true);
    setErrorMessage("");
    const orderNumber = String(data.onumber).trim().replace(/^#/, "");
    userOrders
      .getOrderDetails(orderNumber)
      .then((order) => {
        if (
          order &&
          order.data.attributes.user.data.attributes.email === data.email &&
          order.data.attributes.user.data.attributes.email ===
            user.strapiUserdata.email &&
          order.data.id.toString() === orderNumber
        ) {
          // Was the relative "trackorder/…", which resolved against /order.
          router.push(`/trackorder/${orderNumber}`);
        } else {
          setErrorMessage(t("form.invalidInfo"));
        }
      })
      .catch(() => setErrorMessage(t("form.invalidInfo")))
      .finally(() => setIsLoading(false));
  };

  const required = { required: t("form.required") };

  return (
    <section aria-labelledby="order-lookup" className="max-w-xl mx-auto bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="w-12 h-12 shrink-0 grid place-items-center rounded-full bg-sand text-garden text-2xl">
          <LuPackageSearch />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="order-lookup" className="font-display text-xl md:text-2xl">
            {t("form.heading")}
          </h2>
          <p className="text-garden-muted">{t("description")}</p>
        </div>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit((data) => {
          goToOrder(data);
        })}
        className="flex flex-col gap-4"
      >
        <TextField
          {...register("onumber", required)}
          inputMode="numeric"
          label={t("form.labels.orderNumber")}
          placeholder={t("form.placeholders.orderNumber")}
          error={errors.onumber?.message as string | undefined}
        />
        <TextField
          {...register("email", required)}
          type="email"
          autoComplete="email"
          label={t("form.labels.receiptEmail")}
          placeholder={t("form.placeholders.receiptEmail")}
          error={errors.email?.message as string | undefined}
        />
        {errorMessage && (
          <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
            {errorMessage}
          </p>
        )}
        <Button type="submit" size="lg" full disabled={isLoading} aria-busy={isLoading}>
          {isLoading && <Spinner size="sm" color="current" />}
          <span className="first-letter:uppercase">{t("form.action")}</span>
        </Button>
      </form>
    </section>
  );
};

export default observer(OrderForm);
