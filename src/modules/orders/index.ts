// Public API of the orders context (client-safe). Server code is in ./index.server.
export type { DeliveryAddress, Order, OrderLine, OrderPage, OrderPayment, OrderStatus, OrderSummary, OrderTotals } from "./domain/Order";
export { isInProgress, parseOrderNumber, trackingOf } from "./domain/Order";

export { ordersApi } from "./application/ordersApi";
export { useOrder, useOrders } from "./application/useOrders";

export { default as OrderList } from "./ui/OrderList";
export { default as OrderDetail } from "./ui/OrderDetail";
export { default as OrderTracking } from "./ui/OrderTracking";
export { default as OrderLookup } from "./ui/OrderLookup";
export { default as OrderOverview } from "./ui/OrderOverview";
export { OrderLoading, OrderNotFound, OrdersUnavailable } from "./ui/OrderStates";
