"use client";
import { StoreContext } from "@/contexts/StoreContext";
import React, { useContext, useEffect } from "react";
import OrderItemsContainer from "./OrderItemsContainer";
import { observer } from "mobx-react-lite";
import EmptyOrderTrack from "../../../trackorder/[id]/components/EmptyOrderTrack";
import Orderinfo from "../../../cart/confirmation/components/Orderinfo";
import OrderAddress from "../../../cart/confirmation/components/OrderAddress";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import Shell from "@/shared/ui/PageContainer";
import PageSkeleton from "@/components/feedback/PageSkeleton";
import { useOwnedOrder } from "@/hooks/useOwnedOrder";

const PageContainer = ({ orderId }: { orderId: string }) => {
  const { userOrders } = useContext(StoreContext);
  const t = useTranslations("userOrders");
  const access = useOwnedOrder(orderId);

  useEffect(() => {
    userOrders.getAllOrderItems(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (access === "loading") return <PageSkeleton variant="detail" />;

  return (
    <Shell className="pt-6 pb-8">
      {access === "denied" ? (
        <EmptyOrderTrack />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <OrderItemsContainer />
            <OrderAddress />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
            <Orderinfo />
            <Link href={`/trackorder/${orderId}`} className={buttonClass({ full: true })}>
              {t("details.actions.trackOrder")}
            </Link>
          </div>
        </div>
      )}
    </Shell>
  );
};

export default observer(PageContainer);
