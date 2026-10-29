"use client";
import PageContainer from "@/shared/ui/PageContainer";
import { Divider, Input } from "@nextui-org/react";
import React, { useContext } from "react";
import ShippingForm from "./ShippingForm";
import ShippingOrderAndPrice from "./ShippingOrderAndPrice";
import { StoreContext } from "@/contexts/StoreContext";
import EmptyCart from "../../components/EmptyCart";
import { observer } from "mobx-react-lite";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useLocale } from "next-intl";

const ShippingContent = () => {
  const { cart, userOrders } = useContext(StoreContext);
  const locale = useLocale();
  return (
    <div className="relative" dir={locale === "en" ? "ltr" : "rtl"}>
      {userOrders.isCreatingOrderLoading && <LoadingOverlay />}
      {cart.productsCount > 0 ? (
        <PageContainer className="pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-7">
              <ShippingForm />
            </div>
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <ShippingOrderAndPrice />
            </div>
          </div>
        </PageContainer>
      ) : (
        <PageContainer className="pb-8">
          <EmptyCart />
        </PageContainer>
      )}
    </div>
  );
};

export default observer(ShippingContent);
