"use client";
import { StoreContext } from "@/contexts/StoreContext";
import Button from "@/shared/ui/Button";
import { useTranslations } from "next-intl";
import React, { useContext } from "react";
import { LuPencil } from "react-icons/lu";

const EditButton = () => {
  const { profileModal } = useContext(StoreContext);
  const t = useTranslations("userProfilePage");

  return (
    <Button variant="outline" onClick={profileModal.onOpen}>
      <LuPencil aria-hidden="true" />
      <span className="first-letter:uppercase">{t("actions.main")}</span>
    </Button>
  );
};

export default EditButton;
