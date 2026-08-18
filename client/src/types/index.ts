/**
 * Barrel for every shared type.
 *
 * Components import from "../types" and never need to know which file a type
 * lives in, so a type can move between files without touching a single
 * consumer.
 */
export type { MenuItem } from "./menu";
export type { CartLine } from "./cart";
export { ORDER_STATUSES } from "./order";
export type {
  Customer,
  CreateOrderRequest,
  Order,
  OrderItem,
  OrderStatus,
} from "./order";
export type { LoadState } from "./ui";
export type {
  CartItemRowProps,
  CheckoutFormProps,
  IconProps,
  MenuItemCardProps,
  StatusTrackerProps,
} from "./props";
