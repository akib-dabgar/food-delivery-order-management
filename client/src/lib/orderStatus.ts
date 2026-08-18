import type { OrderStatus } from "../types";

/** Human-readable labels for the lifecycle the server exposes. */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  ORDER_RECEIVED: "Order received",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};
