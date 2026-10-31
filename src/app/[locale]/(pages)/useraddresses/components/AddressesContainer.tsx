"use client";

import React, { useContext, useEffect } from "react";
import { LuPlus } from "react-icons/lu";
import UserAddress from "./UserAddress";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import EmptyAddress from "./EmptyAddress";
import AddNewAddressModal from "./AddNewAddressModal";
import { useTranslations } from "next-intl";
import Button from "@/shared/ui/Button";

const AddressesContainer = () => {
  const { userAddresses, userOrders, addressModal } = useContext(StoreContext);
  const t = useTranslations("userAdderesses");

  useEffect(() => {
    userAddresses.getAllUserAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddresses.isLoading, userOrders.isAddressLoading]);

  return (
    <>
      <AddNewAddressModal />
      {userAddresses?.userAddresses?.length > 0 ? (
        <div className="flex flex-col gap-6">
          <Button onClick={addressModal.onOpen} className="self-start">
            <LuPlus aria-hidden="true" />
            <span className="first-letter:uppercase">{t("new")}</span>
          </Button>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {userAddresses?.userAddresses?.map((add, index) => (
              <li key={add.id}>
                <UserAddress
                  addressId={add.id}
                  index={index + 1}
                  state={add.state}
                  country={add.country}
                  city={add.city}
                  street={add.street}
                  phone={add.phone}
                  secondPhone={add.second_phone}
                  postalCode={add.postal_code}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyAddress />
      )}
    </>
  );
};

export default observer(AddressesContainer);
