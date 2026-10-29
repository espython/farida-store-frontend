"use client";
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
import { useScreenSize } from "react-screen-size-helper";
import { useTranslations } from "next-intl";

const ShippingForm = () => {
  const { handleSubmit, register, reset, setValue } = useForm();
  const { currentWidth } = useScreenSize({});
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
    <div className="flex flex-col ">
      <h1 className="text-lg md:text-2xl font-bold capitalize">
        {t("details.title")}
      </h1>

      <Accordion variant="bordered" className="mt-10">
        <AccordionItem
          title={t("details.code.title")}
          subtitle={t("details.code.description")}
          indicator={<MdOutlineDiscount className="text-sm md:text-lg" />}
          classNames={{
            subtitle: "text-mainPink",
            indicator: "text-sm md:text-2xl text-mainPink",
          }}
        >
          <h1 className="text-sm md:text-2xl capitalize pb-5">
            {t("details.code.question")}{" "}
          </h1>
          <div className="flex flex-wrap items-center gap-5">
            <Input
              labelPlacement="outside"
              inputMode="text"
              radius="sm"
              size={currentWidth > 768 ? "md" : "sm"}
              isRequired
              classNames={{
                label: "text-xs md:text-xl capitalize font-bold ",
              }}
            />

            <Button
              size={currentWidth > 768 ? "md" : "sm"}
              className="bg-mainBlack text-mainWhite px-5 py-2"
            >
              {t("details.code.action")}
            </Button>
          </div>
        </AccordionItem>
      </Accordion>

      {userAddresses.userAddresses.length > 0 && (
        <Button
          radius="none"
          className="bg-mainBlack text-mainWhite text-sm md:text-xl mt-10 capitalize"
          onPress={selectionAddressModal.onOpen}
        >
          {t("details.addresses.select")}
        </Button>
      )}

      <AddressSelectionModal />

      <form
        onSubmit={handleSubmit((data) => {
          submitForm(data);
        })}
        className="mt-10   flex flex-col gap-5 "
      >
        <div className="grid grid-rows-2 grid-cols-1 md:grid-rows-1 md:grid-cols-2 items-center gap-5">
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

        <div className="flex flex-col pt-10 gap-5">
          <div>
            <h1 className="text-lg md:text-2xl font-bold capitalize">
              {t("details.form.notes.title")}
            </h1>
            <h1 className="text-sm md:text-xl text-mainBlack/50 capitalize">
              {t("details.form.notes.description")}
            </h1>
          </div>

          <div>
            <Textarea
              {...register("notes")}
              variant="bordered"
              radius="none"
              placeholder={t("details.form.notes.placeholder")}
              minRows={currentWidth > 768 ? 20 : 10}
            />
          </div>
        </div>

        <Button
          size={currentWidth > 768 ? "md" : "sm"}
          className="bg-mainBlack text-mainWhite capitalize "
          type="submit"
        >
          {t("details.form.action.continue")}
        </Button>
      </form>
    </div>
  );
};

export default observer(ShippingForm);
