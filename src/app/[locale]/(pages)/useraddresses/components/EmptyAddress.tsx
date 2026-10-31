"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import React, { useContext } from "react";
import { LuMapPin, LuPlus } from "react-icons/lu";
import EmptyState from "@/shared/ui/EmptyState";
import Button from "@/shared/ui/Button";

const EmptyAddress = () => {
  const { addressModal } = useContext(StoreContext);
  const t = useTranslations("userAdderesses");
  return (
    <EmptyState
      icon={<LuMapPin />}
      title={t("empty.description")}
      text={t("empty.text")}
      action={
        <Button onClick={addressModal.onOpen}>
          <LuPlus aria-hidden="true" />
          <span className="first-letter:uppercase">{t("new")}</span>
        </Button>
      }
    />
  );
};

export default observer(EmptyAddress);
