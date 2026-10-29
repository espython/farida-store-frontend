"use client";
import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageContainer from "@/shared/ui/PageContainer";
import { buttonClass } from "@/shared/ui/Button";
import { Button, Spinner } from "@nextui-org/react";
import { FaCreditCard, FaMoneyBillWave } from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import { toast } from "react-toastify";
import PaymentIframe from "./components/PaymentIframe";
import PaymentSummary from "./components/PaymentSummary";
import {
  getCheckoutIdempotencyKey,
  clearCheckoutIdempotencyKey,
} from "@/functions/checkoutIdempotency";

const PaymentPage = () => {
  const { cart, user, userOrders, userAddresses, payment } =
    useContext(StoreContext);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("paymentPage");
  const pf = useTranslations("paymentFlow");

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "cod"
  >("card");
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Check if user come from shipping page
  useEffect(() => {
    if (!cart.userCartItems.length) {
      router.push("/cart");
      return;
    }
  }, [cart.userCartItems.length, router, locale]);

  // Resolve the shipping address reference set on the shipping page. Only
  // a non-sensitive id travels in localStorage; personal data is read back
  // from the server (owner-scoped) during checkout.
  const getShippingAddress = async () => {
    try {
      const raw = localStorage.getItem("shippingAddressId") || "{}";
      const { addressId } = JSON.parse(raw);
      if (!addressId) return null;
      const address = await userAddresses.getUserAddressById(addressId);
      return address;
    } catch (err) {
      return null;
    }
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method: "card" | "cod") => {
    setSelectedPaymentMethod(method);
    payment.resetPaymentState();
  };

  // Process card payment: the order + Paymob payment key are both created
  // server-side (POST /order-details/checkout with paymentMethod "card").
  // The returned payment key is rendered in Paymob's hosted iframe — no
  // Paymob secret, cart total or personal data is sent from the browser.
  const processCardPayment = async () => {
    if (!user.strapiUserdata.id) {
      toast.error(
        pf("pleaseLoginFirst")
      );
      return;
    }

    const shippingData = await getShippingAddress();
    if (!shippingData) {
      toast.error(
        pf("pleaseCompleteShippingData")
      );
      return;
    }

    setIsProcessingOrder(true);
    payment.resetPaymentState();

    try {
      const items = cart.userCartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      // Reused across retries of this same intent, so a reload or a lost
      // response resumes the existing order instead of creating a second one.
      const idempotencyKey = getCheckoutIdempotencyKey({
        userId: user.strapiUserdata.id,
        items,
        addressId: shippingData.id,
        paymentMethod: "card",
      });

      const orderData = await userOrders.checkout({
        items,
        orderNotes: "Online payment via Paymob",
        addressId: shippingData.id,
        paymentMethod: "card",
        idempotencyKey,
      });

      if (orderData && orderData.payment) {
        payment.setServerPayment(orderData);
      } else {
        throw new Error("Failed to initiate payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        pf("paymentErrorOccurred")
      );
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Process cash on delivery
  const processCODPayment = async () => {
    if (!user.strapiUserdata.id) {
      toast.error(
        pf("pleaseLoginFirst")
      );
      return;
    }

    const shippingData = await getShippingAddress();
    if (!shippingData) {
      toast.error(
        pf("pleaseCompleteShippingData")
      );
      return;
    }

    setIsProcessingOrder(true);

    try {
      const items = cart.userCartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      const idempotencyKey = getCheckoutIdempotencyKey({
        userId: user.strapiUserdata.id,
        items,
        addressId: shippingData.id,
        paymentMethod: "cod",
      });

      // Create order with COD payment method. The backend resolves the
      // address by id and verifies ownership — no personal data is trusted
      // from the browser.
      const orderData = await userOrders.checkout({
        items,
        orderNotes: "Cash on Delivery",
        addressId: shippingData.id,
        paymentMethod: "cod",
        idempotencyKey,
      });

      if (orderData) {
        await user.clearUserCart(cart.userCartItems);

        // The order exists, so this checkout intent is resolved. Drop the key
        // or a later order of the same items would replay this one.
        clearCheckoutIdempotencyKey();

        // Shipping data was never stored as PII client-side; clear the ref
        localStorage.removeItem("shippingAddressId");

        toast.success(
          pf("orderCreatedSuccessfully")
        );
        router.push(
          `/cart/confirmation?order_number=${orderData?.data?.id}`
        );
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("COD order error:", error);
      toast.error(
        pf("orderCreationFailed")
      );
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Handle payment completion. The order was already created server-side
  // when the card flow started (paymentMethod "card"), and the Paymob
  // webhook marks it paid. Here we only clear the cart and redirect.
  const handlePaymentSuccess = async (
    transactionId?: string,
    paymobOrderId?: string
  ) => {
    try {
      const orderId =
        payment.createdOrderId ?? payment.createdPaymobOrderId ?? "";

      await user.clearUserCart(cart.userCartItems);

      // The order is committed and paid, so the intent is resolved. Drop the
      // key so a later order of the same items is not replayed from this one.
      clearCheckoutIdempotencyKey();

      // Clear the non-sensitive address reference
      localStorage.removeItem("shippingAddressId");

      toast.success(
        pf("paymentSuccessful")
      );
      router.push(
        `/cart/confirmation?order_number=${orderId}`
      );
    } catch (error) {
      console.error("Order creation after payment error:", error);
      toast.error(
        pf("errorAfterPayment")
      );
    }
  };

  if (payment.currentIframeUrl) {
    return (
      <PaymentIframe
        iframeUrl={payment.currentIframeUrl}
        onSuccess={handlePaymentSuccess}
        onError={(error: string) => {
          console.error("Payment iframe error:", error);
          payment.resetPaymentState();
        }}
      />
    );
  }

  const methods = [
    { id: "card" as const, icon: <FaCreditCard aria-hidden="true" />, title: pf("creditdebitCard"), text: pf("paySecurelyWithYour") },
    { id: "cod" as const, icon: <FaMoneyBillWave aria-hidden="true" />, title: pf("cashOnDelivery"), text: pf("payCashWhenYou") },
  ];
  const busy = isProcessingOrder || payment.isInitiatingPayment;

  return (
    <PageContainer className="pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 flex flex-col gap-5">
          <fieldset className="bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-4">
            <legend className="sr-only">{pf("paymentMethods")}</legend>
            <h2 aria-hidden="true" className="font-display text-2xl md:text-[2rem] font-medium flex items-center gap-3">
              <MdPayment aria-hidden="true" />
              {pf("paymentMethods")}
            </h2>
            {methods.map((m) => {
              const on = selectedPaymentMethod === m.id;
              return (
                <label
                  key={m.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
                    on ? "border-garden bg-cream" : "border-line hover:border-garden-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={m.id}
                    checked={on}
                    onChange={() => handlePaymentMethodChange(m.id)}
                    className="w-5 h-5 accent-[#1e3a2b]"
                  />
                  <span className="w-11 h-11 grid place-items-center rounded-full bg-sand text-xl">{m.icon}</span>
                  <span className="flex flex-col">
                    <span className="font-bold">{m.title}</span>
                    <span className="text-sm text-garden-muted">{m.text}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <Button
            className={buttonClass({ size: "lg", full: true })}
            onClick={selectedPaymentMethod === "card" ? processCardPayment : processCODPayment}
            isLoading={busy}
            isDisabled={busy}
          >
            {busy ? null : selectedPaymentMethod === "card" ? pf("payWithCard") : pf("confirmOrder")}
          </Button>

          {payment.paymentError && (
            <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
              {payment.paymentError}
            </p>
          )}
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <PaymentSummary />
        </div>
      </div>
    </PageContainer>
  );
};

export default observer(PaymentPage);
