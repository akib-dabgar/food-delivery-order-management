/** Mirrors the server lifecycle, in order. */
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

/**
 * What the client is allowed to send. Only ids and quantities — the server
 * looks up prices and computes the total.
 */
export interface CreateOrderRequest {
  customer: Customer;
  items: { menuItemId: string; quantity: number }[];
}
