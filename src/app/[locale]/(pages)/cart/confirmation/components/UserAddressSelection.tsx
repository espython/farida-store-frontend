"use client";
import React, { useContext } from "react";
import InfoCard from "./InfoCard";
import { StoreContext } from "@/contexts/StoreContext";
import { UserAddressType } from "@/stores/specificTypes/userAddressType";
import { useTranslations } from "next-intl";
import { observer } from "mobx-react-lite";
import Button from "@/shared/ui/Button";
import { LuMapPin } from "react-icons/lu";

interface userAddressProps {
  addressId: number | string;
  index: number;
  state: string;
  country: string;
  city: string;
  street: string;
  phone: string;
  secondPhone: string;
  postalCode: string;
}

const UserAddressSelection = ({
  addressId,
  index,
  state,
  country,
  city,
  street,
  phone,
  secondPhone,
  postalCode,
}: userAddressProps) => {
  const t = useTranslations("confirmationPage");
  const information: { title: string; description: string }[] = [
    { title: t("orderAddress.street"), description: street },
    { title: t("orderAddress.city"), description: city },
    { title: t("orderAddress.state"), description: state },
    { title: t("orderAddress.country"), description: country },
    { title: t("orderAddress.postal"), description: postalCode },
    { title: t("orderAddress.phone1"), description: phone },
    { title: t("orderAddress.phone2"), description: secondPhone },
  ];

  const { userAddresses, selectionAddressModal } = useContext(StoreContext);
  const isSelected = userAddresses.selectedUserAddress?.id === addressId;

  const selectTheAddress = () => {
    userAddresses.setSelectedUserAddress = {} as UserAddressType;

    const selectedAddress: UserAddressType = {
      id: addressId,
      state: state,
      city: city,
      country: country,
      postal_code: postalCode,
      phone: phone,
      street: street,
      second_phone: secondPhone,
    };
    userAddresses.setSelectedUserAddress = selectedAddress;
    selectionAddressModal.onClose();
  };

  const heading = t("addressSelection.address", { index });

  return (
    <article
      aria-label={heading}
      className={`bg-white rounded-2xl border-2 p-4 md:p-5 flex flex-col gap-4 ${
        isSelected ? "border-garden" : "border-transparent"
      }`}
    >
      <h3 className="flex items-center gap-2 font-bold">
        <LuMapPin aria-hidden="true" className="text-garden" />
        {heading}
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {information.map(
          (info) =>
            info.description && (
              <InfoCard key={info.title} title={info.title} description={info.description} />
            )
        )}
      </dl>
      <Button
        variant={isSelected ? "primary" : "outline"}
        className="self-start"
        aria-pressed={isSelected}
        onClick={selectTheAddress}
      >
        {isSelected ? t("addressSelection.selected") : t("addressSelection.select")}
      </Button>
    </article>
  );
};

export default observer(UserAddressSelection);
