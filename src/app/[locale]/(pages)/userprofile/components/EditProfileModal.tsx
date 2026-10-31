"use client";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import React, { useContext } from "react";
import ModalDataContainer from "./ModalDataContainer";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useScreenSize } from "react-screen-size-helper";
import { useTranslations } from "next-intl";

const EditProfileModal = () => {
  const { profileModal } = useContext(StoreContext);
  const t = useTranslations("userProfilePage");

  const { currentWidth } = useScreenSize({});

  return (
    <Modal
      size={currentWidth > 768 ? "lg" : "full"}
      isOpen={profileModal.isOpen}
      onClose={profileModal.onClose}
      classNames={{
        base: "bg-cream md:rounded-3xl",
        // NextUI pins the close button to the physical right; mirror it for RTL.
        closeButton: "top-3 rtl:right-auto rtl:left-3 w-11 h-11 grid place-items-center text-lg",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="font-display text-xl md:text-2xl font-medium pe-14 first-letter:uppercase">
              {t("actions.main")}
            </ModalHeader>
            <ModalBody className="pb-6">
              <ModalDataContainer />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default observer(EditProfileModal);
