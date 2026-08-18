import { config } from "../config.js";
import { orderStore } from "../store/orderStore.js";
import { ORDER_STATUSES, type OrderStatus } from "../types/index.js";

/**
 * Pure lifecycle rule: the status that follows `current`, or `undefined` once
 * the order has reached the end. Derived from ORDER_STATUSES, so it can never
 * disagree with the type or the Zod enum.
 */
export function nextStatus(current: OrderStatus): OrderStatus | undefined {
  return ORDER_STATUSES[ORDER_STATUSES.indexOf(current) + 1];
}

/** One pending timer per order, keyed by order id so it can be cancelled. */
const timers = new Map<string, NodeJS.Timeout>();

/**
 * Queues the next automatic status change for an order. Does nothing when the
 * order is gone or already DELIVERED, which is what makes the chain stop.
 */
export function scheduleStatusProgression(orderId: string): void {
  const order = orderStore.findById(orderId);

  if (!order || !nextStatus(order.status)) {
    return;
  }

  // Never leave two timers running for the same order.
  cancelStatusProgression(orderId);

  timers.set(
    orderId,
    setTimeout(() => {
      timers.delete(orderId);
      advance(orderId);
    }, config.statusStepMs),
  );
}

/** Applies one step, then queues the following one. */
function advance(orderId: string): void {
  const order = orderStore.findById(orderId);

  if (!order) {
    return;
  }

  const upcoming = nextStatus(order.status);

  if (!upcoming) {
    return;
  }

  orderStore.save({
    ...order,
    status: upcoming,
    updatedAt: new Date().toISOString(),
  });

  scheduleStatusProgression(orderId);
}

export function cancelStatusProgression(orderId: string): void {
  const timer = timers.get(orderId);

  if (timer) {
    clearTimeout(timer);
    timers.delete(orderId);
  }
}

/** Called on shutdown, and by tests, so no timer outlives the process. */
export function stopAllStatusProgressions(): void {
  for (const timer of timers.values()) {
    clearTimeout(timer);
  }

  timers.clear();
}

/** Test/diagnostic hook: how many orders currently have a pending step. */
export function pendingProgressionCount(): number {
  return timers.size;
}
