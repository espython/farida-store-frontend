"use client";
import React, { useContext, useEffect, useState } from "react";
import Thanks from "./Thanks";

import ItemsContainer from "./ItemsContainer";
import Orderinfo from "./Orderinfo";
import OrderAddress from "./OrderAddress";
import { StoreContext } from "@/contexts/StoreContext";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { observer } from "mobx-react-lite";
import NoOrder from "./NoOrder";
import PaymentDetails from "./PaymentDetails";
import PageContainer from "@/shared/ui/PageContainer";
import PageSkeleton from "@/components/feedback/PageSkeleton";

const ConfirmationPageContainer = () => {
  const { userOrders, user } = useContext(StoreContext);
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("order_number");

  // null while the ownership check is running, so the "no order" card does not
  // flash before the order loads. The route is login-only (middleware), so the
  // user id always arrives.
  const [foundedInUserOrders, setFoundedInUserOrders] = useState<boolean | null>(null);

  useEffect(() => {
    if (orderId) {
      userOrders.getOrderDetails(orderId ?? "");
    } else {
      router.push("/cart/shipping");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (orderId && user.strapiUserdata.id) {
      userOrders
        .isOrderInUserOrdersList(orderId, user.strapiUserdata.id)
        .then((value) => {
          setFoundedInUserOrders(value ?? false);
        });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userOrders.isCreatingOrderLoading, user.strapiUserdata.id]);

  if (orderId && foundedInUserOrders === null) return <PageSkeleton variant="detail" />;

  return (
    <PageContainer className="pb-8">
      {orderId && userOrders.orderDetails.data && foundedInUserOrders ? (
        <div className="flex flex-col gap-6 lg:gap-8">
          <Thanks orderId={orderId} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <ItemsContainer />
              <OrderAddress />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
              <Orderinfo />
              <PaymentDetails />
            </div>
          </div>
        </div>
      ) : (
        <NoOrder />
      )}
    </PageContainer>
  );
};

export default observer(ConfirmationPageContainer);
