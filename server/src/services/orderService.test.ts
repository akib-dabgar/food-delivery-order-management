import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { menuItems } from "../data/menu.js";
import { HttpError } from "../errors.js";
import type { CreateOrderInput } from "../schemas/order.schema.js";
import { orderStore } from "../store/orderStore.js";
import type { OrderItem, OrderStatus } from "../types/index.js";
import { stopAllStatusProgressions } from "./statusSimulator.js";
import {
  calculateTotal,
  createOrder,
  getOrder,
  isValidTransition,
  updateOrderStatus,
} from "./orderService.js";

const customer = {
  name: "Asha Rao",
  address: "12 Park Lane, Springfield",
  phone: "9876543210",
};

function validInput(
  items: CreateOrderInput["items"] = [{ menuItemId: "m1", quantity: 2 }],
): CreateOrderInput {
  return { customer, items };
}

beforeEach(() => {
  orderStore.reset();
  // createOrder schedules a status timer; clear them so none leaks between tests.
  stopAllStatusProgressions();
});

describe("calculateTotal", () => {
  function line(price: number, quantity: number): OrderItem {
    return { menuItemId: "x", name: "x", price, quantity };
  }

  it("multiplies price by quantity across every line", () => {
    expect(calculateTotal([line(249, 2), line(189, 1)])).toBe(687);
  });

  it("returns 0 for an empty list", () => {
    expect(calculateTotal([])).toBe(0);
  });

  it("rounds away binary floating point error", () => {
    // 0.1 * 3 is 0.30000000000000004 in IEEE 754.
    expect(calculateTotal([line(0.1, 3)])).toBe(0.3);
    expect(calculateTotal([line(10.05, 3)])).toBe(30.15);
  });
});

describe("isValidTransition", () => {
  it("allows each step forward through the lifecycle", () => {
    expect(isValidTransition("ORDER_RECEIVED", "PREPARING")).toBe(true);
    expect(isValidTransition("PREPARING", "OUT_FOR_DELIVERY")).toBe(true);
    expect(isValidTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
  });

  it("rejects skipping a step", () => {
    expect(isValidTransition("ORDER_RECEIVED", "OUT_FOR_DELIVERY")).toBe(false);
    expect(isValidTransition("ORDER_RECEIVED", "DELIVERED")).toBe(false);
  });

  it("rejects moving backwards", () => {
    expect(isValidTransition("PREPARING", "ORDER_RECEIVED")).toBe(false);
    expect(isValidTransition("DELIVERED", "OUT_FOR_DELIVERY")).toBe(false);
  });

  it("rejects staying on the same status", () => {
    expect(isValidTransition("PREPARING", "PREPARING")).toBe(false);
  });

  it("treats DELIVERED as terminal", () => {
    const statuses: OrderStatus[] = [
      "ORDER_RECEIVED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    for (const target of statuses) {
      expect(isValidTransition("DELIVERED", target)).toBe(false);
    }
  });
});

describe("createOrder", () => {
  it("prices lines from the menu rather than the request", () => {
    const menuItem = menuItems[0]!;
    const order = createOrder(validInput([{ menuItemId: menuItem.id, quantity: 3 }]));

    expect(order.items[0]).toEqual({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 3,
    });
    expect(order.total).toBe(menuItem.price * 3);
  });

  it("starts every order at ORDER_RECEIVED with matching timestamps", () => {
    const order = createOrder(validInput());

    expect(order.status).toBe("ORDER_RECEIVED");
    expect(order.id).not.toBe("");
    expect(order.createdAt).toBe(order.updatedAt);
  });

  it("stores the order so it can be read back", () => {
    const order = createOrder(validInput());

    expect(getOrder(order.id)).toEqual(order);
    expect(orderStore.count()).toBe(1);
  });

  it("gives each order a distinct id", () => {
    const first = createOrder(validInput());
    const second = createOrder(validInput());

    expect(first.id).not.toBe(second.id);
  });

  it("rejects an unknown menu item without storing anything", () => {
    expect(() => createOrder(validInput([{ menuItemId: "nope", quantity: 1 }]))).toThrow(
      HttpError,
    );
    expect(orderStore.count()).toBe(0);
  });

  it("stores nothing when one line of several is invalid", () => {
    expect(() =>
      createOrder(
        validInput([
          { menuItemId: "m1", quantity: 1 },
          { menuItemId: "ghost", quantity: 1 },
        ]),
      ),
    ).toThrow(HttpError);
    expect(orderStore.count()).toBe(0);
  });
});

describe("getOrder", () => {
  it("throws a 404 HttpError for an unknown id", () => {
    try {
      getOrder("missing-id");
      expect.unreachable("getOrder should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(404);
    }
  });
});

describe("updateOrderStatus", () => {
  it("advances the order and refreshes updatedAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T10:00:00.000Z"));

    const order = createOrder(validInput());

    vi.setSystemTime(new Date("2026-08-18T10:05:00.000Z"));
    const updated = updateOrderStatus(order.id, "PREPARING");

    expect(updated.status).toBe("PREPARING");
    expect(updated.createdAt).toBe(order.createdAt);
    expect(Date.parse(updated.updatedAt)).toBeGreaterThan(
      Date.parse(order.createdAt),
    );
  });

  it("persists the new status in the store", () => {
    const order = createOrder(validInput());
    updateOrderStatus(order.id, "PREPARING");

    expect(getOrder(order.id).status).toBe("PREPARING");
  });

  it("rejects an illegal transition and leaves the order untouched", () => {
    const order = createOrder(validInput());

    expect(() => updateOrderStatus(order.id, "DELIVERED")).toThrow(HttpError);
    expect(getOrder(order.id).status).toBe("ORDER_RECEIVED");
  });

  it("walks the full lifecycle then refuses to go further", () => {
    const order = createOrder(validInput());

    expect(updateOrderStatus(order.id, "PREPARING").status).toBe("PREPARING");
    expect(updateOrderStatus(order.id, "OUT_FOR_DELIVERY").status).toBe(
      "OUT_FOR_DELIVERY",
    );
    expect(updateOrderStatus(order.id, "DELIVERED").status).toBe("DELIVERED");
    expect(() => updateOrderStatus(order.id, "DELIVERED")).toThrow(HttpError);
  });

  it("throws 404 for an unknown id", () => {
    try {
      updateOrderStatus("missing-id", "PREPARING");
      expect.unreachable("updateOrderStatus should have thrown");
    } catch (error) {
      expect((error as HttpError).status).toBe(404);
    }
  });
});

afterEach(() => {
  vi.useRealTimers();
  stopAllStatusProgressions();
});
