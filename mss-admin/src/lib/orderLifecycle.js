export const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  PAYMENT_FAILED: "Payment Failed",
};

export const PAYMENT_STATUS = {
  CREATED: "Created",
  PAID: "Paid",
  REFUND_PENDING: "Refund Pending",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

export const REFUND_STATUS = {
  REQUESTED: "Requested",
  PROCESSING: "Processing",
  PROCESSED: "Processed",
  FAILED: "Failed",
};

export function canCancelOrder(order) {
  const status = String(order?.status || "");
  return [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING].includes(status);
}

export function canRefundOrder(order) {
  const paymentStatus = String(order?.payment_status || "");
  const status = String(order?.status || "");
  if (paymentStatus !== PAYMENT_STATUS.PAID) return false;
  if (order?.refund?.status === REFUND_STATUS.PROCESSED) return false;
  return [ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERED].includes(status);
}

export function hasRefundableItems(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.some((item) => item?.policies?.refundable === true);
}

export function hasCancellableItems(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.some((item) => item?.policies?.cancellable === true);
}
