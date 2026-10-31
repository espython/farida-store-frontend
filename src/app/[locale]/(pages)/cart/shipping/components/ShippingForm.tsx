"use client";
import { buttonClass } from "@/shared/ui/Button";
import { StoreContext } from "@/contexts/StoreContext";
import {
  Accordion,
  AccordionItem,
  Button,
  Input,
  Textarea,
} from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { useRouter } from "@/navigation";
import React, { useContext, useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { MdOutlineDiscount } from "react-icons/md";
import { toast } from "react-toastify";
import AddressSelectionModal from "../../confirmation/components/AddressSelectionModal";
import CustomizedInput from "../components/CustomizedInput";
import { useTranslations } from "next-intl";

const ShippingForm = () => {
  const { handleSubmit, register, reset, setValue } = useForm();
  const { user, cart, userOrders, selectionAddressModal, userAddresses } =
    useContext(StoreContext);
  const router = useRouter();
  const t = useTranslations("shippingPage");

  const goToPaymentPage = () => {
    router.push(`/cart/payment`);
  };

  const setSelectedAddressValues = () => {
    setValue("phone", userAddresses.selectedUserAddress.phone);
    setValue("second_phone", userAddresses.selectedUserAddress.second_phone);
    setValue("state", userAddresses.selectedUserAddress.state);
    setValue("country", userAddresses.selectedUserAddress.country);
    setValue("city", userAddresses.selectedUserAddress.city);
    setValue("street", userAddresses.selectedUserAddress.street);
    setValue("postal", userAddresses.selectedUserAddress.postal_code);
  };

  const submitForm = async (data: FieldValues) => {
    if (!user.strapiUserdata?.id) {
      toast.error(t("details.form.errors.login"));
      return;
    }
    const shippingData = {
      street: data.street,
      state: data.state,
      country: data.country,
      city: data.city,
      postal_code: data.postal,
      phone: data.phone,
      second_phone: data.second_phone,
    };

    try {
      const savedAddress = await userOrders.saveUserAddress({
        ...shippingData,
        userId: user.strapiUserdata.id.toString(),
      });

      if (!savedAddress?.data?.id) {
        toast.error(t("details.form.errors.save"));
        return;
      }

      // Only a non-sensitive address reference is kept client-side; the
      // personal data itself is stored and owned server-side.
      localStorage.setItem(
        "shippingAddressId",
        JSON.stringify({ addressId: savedAddress.data.id })
      );
    } catch (err) {
      toast.error(t("details.form.errors.save"));
      return;
    }

    goToPaymentPage();
    reset();
  };

  useEffect(() => {
    userAddresses.getAllUserAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userAddresses.selectedUserAddress.id) {
      setSelectedAddressValues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddresses.selectedUserAddress.id]);

  return (
    <div className="flex flex-col gap-6 bg-white rounded-3xl p-5 md:p-8">
      <h2 className="font-display text-2xl md:text-[2rem] font-medium capitalize">{t("details.title")}</h2>

      <Accordion variant="bordered" className="px-0" itemClasses={{ base: "px-4", title: "font-semibold text-garden" }}>
        <AccordionItem
          title={t("details.code.title")}
          subtitle={t("details.code.description")}
          indicator={<MdOutlineDiscount className="text-sm md:text-lg" />}
          classNames={{
            subtitle: "text-saffron-ink",
            indicator: "text-xl text-saffron-ink",
          }}
        >
          <p className="capitalize pb-4">{t("details.code.question")}</p>
          <div className="flex flex-wrap items-center gap-5">
            <Input
              aria-label={t("details.code.title")}
              inputMode="text"
              radius="full"
              className="flex-1 min-w-[12rem]"
              classNames={{ inputWrapper: "h-11 bg-cream border border-line shadow-none" }}
            />

            <Button className={buttonClass({ variant: "outline" })}>
              {t("details.code.action")}
            </Button>
          </div>
        </AccordionItem>
      </Accordion>

      {userAddresses.userAddresses.length > 0 && (
        <Button className={`${buttonClass({ variant: "outline" })} self-start capitalize`} onPress={selectionAddressModal.onOpen}>
          {t("details.addresses.select")}
        </Button>
      )}

      <AddressSelectionModal />

      <form
        onSubmit={handleSubmit((data) => {
          submitForm(data);
        })}
        className="flex flex-col gap-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CustomizedInput
            formHookRegister={register("phone")}
            label={t("details.form.labels.phone1")}
            labelPlacement="top"
            type="tel"
            inputMode="tel"
            placeholder={t("details.form.placeholders.phone1")}
            classNames={{ inputContainer: "ltr:text-left rtl:text-right" }}
            required
          />

          <CustomizedInput
            formHookRegister={register("second_phone")}
            label={t("details.form.labels.phone2")}
            labelPlacement="top"
            type="tel"
            inputMode="tel"
            placeholder={t("details.form.placeholders.phone2")}
            classNames={{ inputContainer: "ltr:text-left rtl:text-right" }}
          />
        </div>

        <CustomizedInput
          formHookRegister={register("state")}
          label={t("details.form.labels.state")}
          labelPlacement="top"
          type="text"
          inputMode="text"
          placeholder={t("details.form.placeholders.state")}
          required
        />

        <CustomizedInput
          formHookRegister={register("country")}
          label={t("details.form.labels.country")}
          labelPlacement="top"
          type="text"
          inputMode="text"
          placeholder={t("details.form.placeholders.country")}
          required
        />

        <CustomizedInput
          formHookRegister={register("city")}
          label={t("details.form.labels.city")}
          labelPlacement="top"
          type="text"
          inputMode="text"
          placeholder={t("details.form.placeholders.city")}
          required
        />

        <CustomizedInput
          formHookRegister={register("street")}
          label={t("details.form.labels.street")}
          labelPlacement="top"
          type="text"
          inputMode="text"
          placeholder={t("details.form.placeholders.street")}
          required
        />

        <CustomizedInput
          formHookRegister={register("postal")}
          label={t("details.form.labels.postal")}
          labelPlacement="top"
          type="text"
          inputMode="text"
          placeholder={t("details.form.placeholders.postal")}
          required
        />

        <div className="flex flex-col pt-4 gap-3">
          <div>
            <h3 className="font-display text-xl capitalize">{t("details.form.notes.title")}</h3>
            <p className="text-sm text-garden-muted first-letter:uppercase">{t("details.form.notes.description")}</p>
          </div>

          <div>
            <Textarea
              {...register("notes")}
              aria-label={t("details.form.notes.title")}
              radius="lg"
              placeholder={t("details.form.notes.placeholder")}
              minRows={5}
              classNames={{ inputWrapper: "bg-white border border-line shadow-none" }}
            />
          </div>
        </div>

        <Button className={`${buttonClass({ size: "lg", full: true })} capitalize`} type="submit">
          {t("details.form.action.continue")}
        </Button>
      </form>
    </div>
  );
};

export default observer(ShippingForm);
