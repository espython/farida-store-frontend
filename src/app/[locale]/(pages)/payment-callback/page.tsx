"use client";
import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { Link, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import { LuCheck, LuClock, LuX } from "react-icons/lu";
import { toast } from "react-toastify";
import { clearCheckoutIdempotencyKey } from "@/functions/checkoutIdempotency";
import PageContainer from "@/shared/ui/PageContainer";
import { buttonClass } from "@/shared/ui/Button";
import { formatAmount } from "@/shared/lib/price";

type Status = "success" | "failed" | "pending";

const STATUS_ICON: Record<Status, { icon: React.ReactNode; className: string }> = {
  success: { icon: <LuCheck />, className: "bg-garden text-cream" },
  pending: { icon: <LuClock />, className: "bg-[#fbe9c4] text-saffron-ink" },
  failed: { icon: <LuX />, className: "bg-[#fde8e6] text-[#b42318]" },
};

const PaymentCallbackPage = () => {
  const { payment, cart, user } = useContext(StoreContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("paymentCallback");
  const currency = useTranslations("currency");

  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<Status | null>(null);
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

          toast.success(t("toastSuccess"));

          // Redirect to confirmation page after 3 seconds
          setTimeout(() => {
            if (orderId) {
              router.push(`/cart/confirmation?order_number=${orderId}`);
            } else {
              router.push("/userorders");
            }
          }, 3000);
        } else if (result.message?.includes("pending")) {
          setPaymentStatus("pending");
        } else {
          setPaymentStatus("failed");
          toast.error(t("toastFailed"));
        }
      } catch (error) {
        console.error("Payment callback processing error:", error);
        setPaymentStatus("failed");
        toast.error(t("toastError"));
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, payment, cart, user, router]);

  if (isProcessing || !paymentStatus) {
    return (
      <PageContainer className="py-12 md:py-16">
        <div role="status" className="max-w-md mx-auto flex flex-col items-center text-center gap-3 px-6 py-12 bg-white rounded-3xl">
          <Spinner size="lg" />
          <h1 className="font-display text-xl md:text-2xl">{t("processing")}</h1>
          <p className="text-garden-muted">{t("processingText")}</p>
        </div>
      </PageContainer>
    );
  }

  const text =
    paymentStatus === "success"
      ? orderCreated
        ? t("successText")
        : t("successCreating")
      : paymentStatus === "pending"
      ? t("pendingText")
      : t("failedText");

  const showActions = paymentStatus !== "success" || orderCreated;

  return (
    <PageContainer className="py-12 md:py-16">
      <section
        role={paymentStatus === "failed" ? "alert" : "status"}
        className="max-w-md mx-auto flex flex-col items-center text-center gap-3 px-6 py-10 md:py-12 bg-white rounded-3xl"
      >
        <span
          aria-hidden="true"
          className={`w-16 h-16 grid place-items-center rounded-full text-3xl ${STATUS_ICON[paymentStatus].className}`}
        >
          {STATUS_ICON[paymentStatus].icon}
        </span>
        <h1 className="font-display text-2xl md:text-[2rem] leading-tight">{t(paymentStatus)}</h1>
        <p className="text-garden-muted">{text}</p>

        {showActions && (
          <div className="w-full flex flex-col gap-3 mt-3">
            {paymentStatus === "failed" ? (
              <Link href="/cart/payment" className={buttonClass({ full: true })}>
                {t("tryAgain")}
              </Link>
            ) : (
              <Link href="/userorders" className={buttonClass({ full: true })}>
                {t("myOrders")}
              </Link>
            )}
            <Link href="/" className={buttonClass({ variant: "outline", full: true })}>
              {t("home")}
            </Link>
          </div>
        )}

        {/* Transaction details */}
        {(payment.paymentResult?.transactionId || payment.paymentResult?.amount) && (
          <dl aria-label={t("transactionDetails")} className="w-full mt-4 rounded-2xl bg-cream p-4 flex flex-col gap-2 text-sm text-start">
            {payment.paymentResult.transactionId && (
              <div className="flex justify-between gap-4">
                <dt className="text-garden-muted">{t("transactionId")}</dt>
                <dd className="font-mono" dir="ltr">{payment.paymentResult.transactionId}</dd>
              </div>
            )}
            {payment.paymentResult.amount && (
              <div className="flex justify-between gap-4">
                <dt className="text-garden-muted">{t("amount")}</dt>
                <dd className="font-semibold">
                  {formatAmount(payment.paymentResult.amount)} <span className="text-xs">{currency("currency")}</span>
                </dd>
              </div>
            )}
          </dl>
        )}
      </section>
    </PageContainer>
  );
};

export default observer(PaymentCallbackPage);
