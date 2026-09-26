"use client";
import React, { useContext } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardBody, CardHeader, Chip, Divider } from "@nextui-org/react";
import { FaCreditCard, FaMoneyBillWave, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { getOrderPaymentDisplay } from "@/functions/orderPaymentState";

const PaymentDetails = () => {
  const { userOrders } = useContext(StoreContext);
  const locale = useLocale();
  const t = useTranslations("confirmationPage");
  const currency = useTranslations("currency");

  const totalAmount = userOrders.orderDetails.data?.attributes?.total;

  const paymentInfo = getOrderPaymentDisplay(
    userOrders.orderDetails.data?.attributes
  );

  const getPaymentIcon = () => {
    switch (paymentInfo.method) {
      case "online":
        return <FaCreditCard className="text-blue-500" />;
      case "cod":
        return <FaMoneyBillWave className="text-green-500" />;
      default:
        return <FaCreditCard className="text-gray-500" />;
    }
  };

  const getPaymentMethodText = () => {
    switch (paymentInfo.method) {
      case "online":
        return locale === "ar" ? "دفع إلكتروني" : "Online Payment";
      case "cod":
        return locale === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery";
      default:
        return locale === "ar" ? "غير محدد" : "Unknown";
    }
  };

  const getStatusIcon = () => {
    switch (paymentInfo.status) {
      case "completed":
        return <FaCheckCircle className="text-green-500" />;
      case "pending":
        return <FaClock className="text-yellow-500" />;
      default:
        return <FaTimesCircle className="text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (paymentInfo.status) {
      case "completed":
        return locale === "ar" ? "مكتمل" : "Completed";
      case "pending":
        return locale === "ar" ? "في الانتظار" : "Pending";
      case "failed":
        return locale === "ar" ? "فشل" : "Failed";
      default:
        return locale === "ar" ? "غير معروف" : "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (paymentInfo.status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      default:
        return "danger";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {getPaymentIcon()}
          <div>
            <h3 className="text-lg font-semibold">
              {locale === "ar" ? "تفاصيل الدفع" : "Payment Details"}
            </h3>
            <p className="text-sm text-gray-600">
              {locale === "ar" ? "معلومات الدفع والمعاملة" : "Payment and transaction information"}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Payment Method */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {locale === "ar" ? "طريقة الدفع:" : "Payment Method:"}
            </span>
            <span className="text-sm font-semibold">
              {getPaymentMethodText()}
            </span>
          </div>

          <Divider />

          {/* Payment Status */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {locale === "ar" ? "حالة الدفع:" : "Payment Status:"}
            </span>
            <Chip
              startContent={getStatusIcon()}
              color={getStatusColor()}
              variant="flat"
              size="sm"
            >
              {getStatusText()}
            </Chip>
          </div>

          <Divider />

          {/* Amount */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {locale === "ar" ? "المبلغ المدفوع:" : "Amount Paid:"}
            </span>
            <span className="text-lg font-bold text-green-600">
              {totalAmount} {currency("currency")}
            </span>
          </div>

          {/* Transaction Details (for online payments) */}
          {paymentInfo.method === "online" && (
            <>
              <Divider />
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 mb-3">
                  {locale === "ar" ? "تفاصيل المعاملة" : "Transaction Details"}
                </h4>
                
                {paymentInfo.transactionId && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-blue-600">
                      {locale === "ar" ? "رقم المعاملة:" : "Transaction ID:"}
                    </span>
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border">
                      {paymentInfo.transactionId}
                    </span>
                  </div>
                )}
                
                {paymentInfo.paymobOrderId && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-600">
                      {locale === "ar" ? "رقم طلب Paymob:" : "Paymob Order ID:"}
                    </span>
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border">
                      {paymentInfo.paymobOrderId}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* COD Information */}
          {paymentInfo.method === "cod" && (
            <>
              <Divider />
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-700 mb-2">
                  {locale === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery"}
                </h4>
                <p className="text-sm text-yellow-600">
                  {locale === "ar" 
                    ? "سيتم تحصيل المبلغ عند استلام الطلب. يرجى تحضير المبلغ المطلوب."
                    : "Payment will be collected upon delivery. Please prepare the exact amount."
                  }
                </p>
              </div>
            </>
          )}

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500 text-sm" />
              <span className="text-xs text-green-700">
                {locale === "ar" 
                  ? "جميع المعاملات آمنة ومحمية"
                  : "All transactions are secure and protected"
                }
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default observer(PaymentDetails);
