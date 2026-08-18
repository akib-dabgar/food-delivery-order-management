import { randomUUID } from "node:crypto";
import { menuItems } from "../data/menu.js";
import { HttpError } from "../errors.js";
import type { CreateOrderInput } from "../schemas/order.schema.js";
import { orderStore } from "../store/orderStore.js";
import {
  ORDER_STATUSES,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "../types/index.js";
import { scheduleStatusProgression } from "./statusSimulator.js";

/** Money is held as a number, so totals are rounded to cents after summing. */
function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculateTotal(items: OrderItem[]): number {
  return roundMoney(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
}

/** A status may only advance to the next one in the lifecycle. */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUSES.indexOf(to) === ORDER_STATUSES.indexOf(from) + 1;
}

/**
 * Builds an order from menu data. The request supplies ids and quantities
 * only — names and prices are looked up here, so a client cannot influence
 * what anything costs.
 */
export function createOrder(input: CreateOrderInput): Order {
  const items: OrderItem[] = input.items.map((line) => {
    const menuItem = menuItems.find((item) => item.id === line.menuItemId);

    if (!menuItem) {
      throw new HttpError(400, `Unknown menu item: ${line.menuItemId}`);
    }

    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: line.quantity,
    };
  });

  const now = new Date().toISOString();

  const order = orderStore.save({
    id: randomUUID(),
    customer: input.customer,
    items,
    total: calculateTotal(items),
    status: "ORDER_RECEIVED",
    createdAt: now,
    updatedAt: now,
  });

  // Every order starts moving through the lifecycle on its own.
  scheduleStatusProgression(order.id);

  return order;
}

export function getOrder(id: string): Order {
  const order = orderStore.findById(id);

  if (!order) {
    throw new HttpError(404, `Order not found: ${id}`);
  }

  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order {
  const order = getOrder(id);

  if (!isValidTransition(order.status, status)) {
    throw new HttpError(
      400,
      `Cannot change status from ${order.status} to ${status}`,
    );
  }

  return orderStore.save({
    ...order,
    status,
    updatedAt: new Date().toISOString(),
  });
}
