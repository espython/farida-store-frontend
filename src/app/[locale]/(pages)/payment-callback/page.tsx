"use client";
import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, CardBody, Spinner } from "@nextui-org/react";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import { toast } from "react-toastify";
import { clearCheckoutIdempotencyKey } from "@/functions/checkoutIdempotency";

const PaymentCallbackPage = () => {
  const { payment, cart, user } = useContext(StoreContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("paymentCallback");

  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | "pending" | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    const processPaymentCallback = async () => {
      try {
        // Get payment result from URL parameters
        const result = payment.handlePaymentCallback(searchParams);
        
        if (result.success) {
          setPaymentStatus("success");

          // The order was already created server-side by the card checkout
          // (paymentMethod "card"); the Paymob webhook flips it to paid. On
          // the redirect callback we only resolve the order id and
          // re-verify its status — never create a duplicate order.
          const orderId =
            payment.createdOrderId ??
            searchParams.get("order") ??
            searchParams.get("merchant_order_id");

          await user.clearUserCart(cart.userCartItems);
          clearCheckoutIdempotencyKey();
          localStorage.removeItem("shippingAddressId");

          setOrderCreated(true);

          toast.success(locale === "ar" ? "تم الدفع بنجاح" : "Payment successful");

          // Redirect to confirmation page after 3 seconds
          setTimeout(() => {
            if (orderId) {
              router.push(`/cart/confirmation?order_number=${orderId}`);
            } else {
              router.push("/profile/orders");
            }
          }, 3000);
        } else if (result.message?.includes("pending")) {
          setPaymentStatus("pending");
        } else {
          setPaymentStatus("failed");
          toast.error(locale === "ar" ? "فشل الدفع" : "Payment failed");
        }
      } catch (error) {
        console.error("Payment callback processing error:", error);
        setPaymentStatus("failed");
        toast.error(locale === "ar" ? "حدث خطأ في معالجة الدفع" : "Error processing payment");
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentCallback();
  }, [searchParams, payment, cart, user, locale, router]);

  const handleRetryPayment = () => {
    router.push("/cart/payment");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoToOrders = () => {
    router.push("/profile/orders");
  };

  if (isProcessing) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${locale === "ar" ? "rtl" : "ltr"}`}>
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-12">
            <Spinner size="lg" className="mb-6" />
            <h2 className="text-xl font-semibold mb-2">
              {locale === "ar" ? "جاري معالجة الدفع..." : "Processing Payment..."}
            </h2>
            <p className="text-gray-600">
              {locale === "ar" 
                ? "يرجى الانتظار بينما نتحقق من حالة الدفع"
                : "Please wait while we verify your payment status"
              }
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${locale === "ar" ? "rtl" : "ltr"}`}>
      <Card className="w-full max-w-md">
        <CardBody className="text-center py-12">
          {paymentStatus === "success" && (
            <>
              <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-green-700 mb-4">
                {locale === "ar" ? "تم الدفع بنجاح!" : "Payment Successful!"}
              </h2>
              <p className="text-gray-600 mb-6">
                {orderCreated 
                  ? (locale === "ar" 
                      ? "تم إنشاء طلبك بنجاح. سيتم توجيهك إلى صفحة التأكيد قريباً."
                      : "Your order has been created successfully. You will be redirected to the confirmation page shortly."
                    )
                  : (locale === "ar"
                      ? "تم الدفع بنجاح. جاري إنشاء طلبك..."
                      : "Payment successful. Creating your order..."
                    )
                }
              </p>
              {orderCreated && (
                <div className="space-y-3">
                  <Button
                    color="primary"
                    className="w-full"
                    onClick={handleGoToOrders}
                  >
                    {locale === "ar" ? "عرض طلباتي" : "View My Orders"}
                  </Button>
                  <Button
                    variant="bordered"
                    className="w-full"
                    onClick={handleGoHome}
                  >
                    {locale === "ar" ? "العودة للرئيسية" : "Go to Home"}
                  </Button>
                </div>
              )}
            </>
          )}

          {paymentStatus === "pending" && (
            <>
              <FaClock className="text-6xl text-yellow-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-yellow-700 mb-4">
                {locale === "ar" ? "الدفع قيد المراجعة" : "Payment Pending"}
              </h2>
              <p className="text-gray-600 mb-6">
                {locale === "ar" 
                  ? "دفعتك قيد المراجعة. سنقوم بإشعارك عند تأكيد الدفع."
                  : "Your payment is being reviewed. We'll notify you once it's confirmed."
                }
              </p>
              <div className="space-y-3">
                <Button
                  color="primary"
                  className="w-full"
                  onClick={handleGoToOrders}
                >
                  {locale === "ar" ? "عرض طلباتي" : "View My Orders"}
                </Button>
                <Button
                  variant="bordered"
                  className="w-full"
                  onClick={handleGoHome}
                >
                  {locale === "ar" ? "العودة للرئيسية" : "Go to Home"}
                </Button>
              </div>
            </>
          )}

          {paymentStatus === "failed" && (
            <>
              <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-red-700 mb-4">
                {locale === "ar" ? "فشل الدفع" : "Payment Failed"}
              </h2>
              <p className="text-gray-600 mb-6">
                {locale === "ar" 
                  ? "لم نتمكن من معالجة دفعتك. يرجى المحاولة مرة أخرى."
                  : "We couldn't process your payment. Please try again."
                }
              </p>
              <div className="space-y-3">
                <Button
                  color="primary"
                  className="w-full"
                  onClick={handleRetryPayment}
                >
                  {locale === "ar" ? "إعادة المحاولة" : "Try Again"}
                </Button>
                <Button
                  variant="bordered"
                  className="w-full"
                  onClick={handleGoHome}
                >
                  {locale === "ar" ? "العودة للرئيسية" : "Go to Home"}
                </Button>
              </div>
            </>
          )}

          {/* Transaction Details */}
          {payment.paymentResult && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
              <h3 className="font-semibold mb-2">
                {locale === "ar" ? "تفاصيل المعاملة" : "Transaction Details"}
              </h3>
              <div className="text-sm space-y-1">
                {payment.paymentResult.transactionId && (
                  <p>
                    <span className="font-medium">
                      {locale === "ar" ? "رقم المعاملة:" : "Transaction ID:"}
                    </span>{" "}
                    {payment.paymentResult.transactionId}
                  </p>
                )}
                {payment.paymentResult.amount && (
                  <p>
                    <span className="font-medium">
                      {locale === "ar" ? "المبلغ:" : "Amount:"}
                    </span>{" "}
                    {payment.paymentResult.amount} EGP
                  </p>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default observer(PaymentCallbackPage);
