"use client";
import { useTranslations } from "next-intl";
import Badge from "@/shared/ui/Badge";
import type { OrderStatus } from "../domain/Order";

const TONE = {
  awaiting_payment: "warning",
  placed: "muted",
  out_for_delivery: "dark",
  delivered: "success",
  cancelled: "danger",
  refunded: "muted",
  failed: "danger",
} as const satisfies Record<OrderStatus, string>;

const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const t = useTranslations("orders.status");
  return <Badge tone={TONE[status]}>{t(status)}</Badge>;
};

export default OrderStatusBadge;
