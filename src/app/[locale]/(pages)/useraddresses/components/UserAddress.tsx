"use client";
import React, { useContext, useState } from "react";
import AddressCell from "./AddressCell";
import { LuMapPin, LuTrash2 } from "react-icons/lu";
import { StoreContext } from "@/contexts/StoreContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useTranslations } from "next-intl";
import Button from "@/shared/ui/Button";

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

const UserAddress = ({
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
  const t = useTranslations("userAdderesses");

  const information: { title: string; description: string }[] = [
    { title: t("address.street"), description: street },
    { title: t("address.city"), description: city },
    { title: t("address.state"), description: state },
    { title: t("address.country"), description: country },
    { title: t("address.postal"), description: postalCode },
    { title: t("address.phone1"), description: phone },
    { title: t("address.phone2"), description: secondPhone },
  ];

  const { userAddresses } = useContext(StoreContext);

  const [isLoading, setIsloading] = useState(false);
  // Deleting is permanent, so it takes a second click.
  const [confirming, setConfirming] = useState(false);

  const deleteTheAddress = () => {
    setIsloading(true);
    userAddresses
      .deleteUserAddress(addressId)
      .then((ok) => {
        setIsloading(false);
      })
      .catch((err) => {
        setIsloading(false);
      });
  };

  const heading = t("address.title", { index });

  return (
    <article aria-label={heading} className="relative h-full bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      {isLoading && <LoadingOverlay />}
      <h2 className="flex items-center gap-2 font-display text-xl">
        <LuMapPin aria-hidden="true" className="text-garden" />
        {heading}
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
        {information.map(
          (info) =>
            info.description && <AddressCell key={info.title} title={info.title} description={info.description} />
        )}
      </dl>
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-line">
        {confirming ? (
          <>
            <span role="status" className="text-sm font-semibold me-auto">
              {t("address.confirm")}
            </span>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t("address.cancel")}
            </Button>
            <Button variant="danger" onClick={deleteTheAddress}>
              <LuTrash2 aria-hidden="true" />
              {t("address.delete")}
            </Button>
          </>
        ) : (
          <Button variant="ghost" className="text-[#b42318] -ms-3" onClick={() => setConfirming(true)}>
            <LuTrash2 aria-hidden="true" />
            <span className="first-letter:uppercase">{t("address.delete")}</span>
          </Button>
        )}
      </div>
    </article>
  );
};

export default UserAddress;
