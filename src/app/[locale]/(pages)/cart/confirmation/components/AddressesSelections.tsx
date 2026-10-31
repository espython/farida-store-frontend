"use client";
import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import UserAddressSelection from "./UserAddressSelection";
import { StoreContext } from "@/contexts/StoreContext";

const AddressesSelections = () => {
  const { userAddresses } = useContext(StoreContext);

  return (
    <ul className="flex flex-col gap-3">
      {userAddresses.userAddresses.map((address, index) => (
        <li key={address.id}>
          <UserAddressSelection
            index={index + 1}
            addressId={address.id}
            state={address.state}
            country={address.country}
            city={address.city}
            street={address.street}
            phone={address.phone}
            secondPhone={address.second_phone}
            postalCode={address.postal_code}
          />
        </li>
      ))}
    </ul>
  );
};

export default observer(AddressesSelections);
