"use client";
import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useRouter } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, CardBody, CardHeader, Spinner } from "@nextui-org/react";
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
        locale === "ar" ? "يجب تسجيل الدخول أولاً" : "Please login first"
      );
      return;
    }

    const shippingData = await getShippingAddress();
    if (!shippingData) {
      toast.error(
        locale === "ar"
          ? "أدخل بيانات الشحن أولاً"
          : "Please complete shipping data first"
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
        locale === "ar" ? "حدث خطأ في الدفع" : "Payment error occurred"
      );
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Process cash on delivery
  const processCODPayment = async () => {
    if (!user.strapiUserdata.id) {
      toast.error(
        locale === "ar" ? "يجب تسجيل الدخول أولاً" : "Please login first"
      );
      return;
    }

    const shippingData = await getShippingAddress();
    if (!shippingData) {
      toast.error(
        locale === "ar"
          ? "أدخل بيانات الشحن أولاً"
          : "Please complete shipping data first"
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
          locale === "ar"
            ? "تم إنشاء الطلب بنجاح"
            : "Order created successfully"
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
        locale === "ar" ? "حدث خطأ في إنشاء الطلب" : "Order creation failed"
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
        locale === "ar" ? "تم الدفع بنجاح" : "Payment successful"
      );
      router.push(
        `/cart/confirmation?order_number=${orderId}`
      );
    } catch (error) {
      console.error("Order creation after payment error:", error);
      toast.error(
        locale === "ar" ? "حدث خطأ بعد الدفع" : "Error after payment"
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

  return (
    <div
      className={`min-h-screen bg-gray-50 py-8 px-4 ${
        locale === "ar" ? "rtl" : "ltr"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">
          {t("title")}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MdPayment />
                  {locale === "ar" ? "طرق الدفع" : "Payment Methods"}
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Credit Card Payment */}
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === "card"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handlePaymentMethodChange("card")}
                >
                  <div className="flex items-center gap-3">
                    <FaCreditCard className="text-2xl text-blue-600" />
                    <div>
                      <h3 className="font-semibold">
                        {locale === "ar"
                          ? "بطاقة ائتمان/خصم"
                          : "Credit/Debit Card"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {locale === "ar"
                          ? "ادفع بأمان باستخدام بطاقتك"
                          : "Pay securely with your card"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery */}
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === "cod"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handlePaymentMethodChange("cod")}
                >
                  <div className="flex items-center gap-3">
                    <FaMoneyBillWave className="text-2xl text-green-600" />
                    <div>
                      <h3 className="font-semibold">
                        {locale === "ar"
                          ? "الدفع عند الاستلام"
                          : "Cash on Delivery"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {locale === "ar"
                          ? "ادفع نقداً عند استلام طلبك"
                          : "Pay cash when you receive your order"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Payment Button */}
            <Button
              size="lg"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              onClick={
                selectedPaymentMethod === "card"
                  ? processCardPayment
                  : processCODPayment
              }
              isLoading={isProcessingOrder || payment.isInitiatingPayment}
              isDisabled={isProcessingOrder || payment.isInitiatingPayment}
            >
              {isProcessingOrder || payment.isInitiatingPayment
                ? null
                : selectedPaymentMethod === "card"
                ? locale === "ar"
                  ? "ادفع بالبطاقة"
                  : "Pay with Card"
                : locale === "ar"
                ? "تأكيد الطلب"
                : "Confirm Order"}
            </Button>

            {payment.paymentError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{payment.paymentError}</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <PaymentSummary />
        </div>
      </div>
    </div>
  );
};

export default observer(PaymentPage);
