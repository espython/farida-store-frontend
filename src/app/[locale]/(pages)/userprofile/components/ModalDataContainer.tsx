"use client";

import { StoreContext } from "@/contexts/StoreContext";
import { Button } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import CustomizedInput from "../../cart/shipping/components/CustomizedInput";
import { useLocale, useTranslations } from "next-intl";
import { useScreenSize } from "react-screen-size-helper";

const ModalDataContainer = () => {
  const { register, setValue, handleSubmit } = useForm();
  const { user } = useContext(StoreContext);
  const [loading, setLoading] = useState(false);
  const { profileModal } = useContext(StoreContext);
  const t = useTranslations("userProfilePage");
  const locale = useLocale();
  const { currentWidth } = useScreenSize({});

  const setFormValues = () => {
    setValue("username", user.strapiUserdata.username);
    setValue("email", user.strapiUserdata.email);
    setValue("first_name", user.strapiUserdata.first_name);
    setValue("last_name", user.strapiUserdata.last_name);
  };

  const updateTheUserData = (data: FieldValues) => {
    setLoading(true);
    const newData: {
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    } = {
      username: data.username,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
    };
    user
      .updateUserData(newData)
      .then(() => {
        toast.success(t("messages.success"));
        // profileModal.onClose();
      })
      .catch((err) => {
        toast.error(t("messages.failed"));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setFormValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.strapiUserdata.updatedAt]);

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          updateTheUserData(data);
        })}
        className="flex flex-col gap-3"
        dir={locale === "en" ? "ltr" : "rtl"}
      >
        <CustomizedInput
          formHookRegister={register("username")}
          label={t("userDetails.username")}
        />
        <CustomizedInput
          formHookRegister={register("email")}
          label={t("userDetails.email")}
        />
        <CustomizedInput
          formHookRegister={register("first_name")}
          label={t("userDetails.firstName")}
        />
        <CustomizedInput
          formHookRegister={register("last_name")}
          label={t("userDetails.lastName")}
        />
        <Button
          type="submit"
          className="bg-mainBlack text-mainWhite text-sm md:text-xl capitalize"
          radius="none"
          isLoading={loading}
          isDisabled={loading}
          size={currentWidth > 768 ? "md" : "sm"}
        >
          {t("actions.modal")}
        </Button>
      </form>
    </>
  );
};

export default observer(ModalDataContainer);
