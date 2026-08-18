import type { Order } from "../types/index.js";

/** In-memory order storage. Cleared whenever the process restarts. */
const orders = new Map<string, Order>();

export const orderStore = {
  save(order: Order): Order {
    orders.set(order.id, order);
    return order;
  },

  findById(id: string): Order | undefined {
    return orders.get(id);
  },

  count(): number {
    return orders.size;
  },

  /** Test hook: the store is a module singleton, so suites must clear it. */
  reset(): void {
    orders.clear();
  },
};
