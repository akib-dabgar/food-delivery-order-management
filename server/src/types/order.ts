/**
 * The status lifecycle, in order. This single constant is the source of the
 * `OrderStatus` type, the Zod enum, and the legal-transition rule, so the three
 * cannot drift apart.
 */
export const ORDER_STATUSES = [
  "ORDER_RECEIVED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Customer {
  name: string;
  address: string;
  phone: string;
}

/** A priced line on an order. Price is copied from the menu at order time. */
export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
