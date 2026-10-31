"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import AddressesSelections from "./AddressesSelections";
import { useScreenSize } from "react-screen-size-helper";
import { useTranslations } from "next-intl";

const AddressSelectionModal = () => {
  const { selectionAddressModal } = useContext(StoreContext);
  const { currentWidth } = useScreenSize({});
  const t = useTranslations("confirmationPage.addressSelection");

  return (
    <Modal
      placement="center"
      size={currentWidth > 768 ? "2xl" : "full"}
      scrollBehavior="inside"
      isOpen={selectionAddressModal.isOpen}
      onClose={selectionAddressModal.onClose}
      classNames={{
        base: "z-[87] bg-cream md:rounded-3xl",
        body: "z-[87]",
        wrapper: "z-[87]",
        // NextUI pins the close button to the physical right; mirror it for RTL.
        closeButton: "top-3 rtl:right-auto rtl:left-3 w-11 h-11 grid place-items-center text-lg",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="font-display text-xl md:text-2xl font-medium pe-14">{t("title")}</ModalHeader>
            <ModalBody className="pb-6">
              <AddressesSelections />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default observer(AddressSelectionModal);
