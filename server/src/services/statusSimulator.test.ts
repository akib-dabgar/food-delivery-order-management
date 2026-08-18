import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "../config.js";
import { orderStore } from "../store/orderStore.js";
import { ORDER_STATUSES, type OrderStatus } from "../types/index.js";
import { createOrder, getOrder, isValidTransition } from "./orderService.js";
import {
  cancelStatusProgression,
  nextStatus,
  pendingProgressionCount,
  scheduleStatusProgression,
  stopAllStatusProgressions,
} from "./statusSimulator.js";

const validInput = {
  customer: {
    name: "Asha Rao",
    address: "12 Park Lane, Springfield",
    phone: "9876543210",
  },
  items: [{ menuItemId: "m1", quantity: 1 }],
};

/** Moves virtual time forward by one configured status step. */
function advanceOneStep(): void {
  vi.advanceTimersByTime(config.statusStepMs);
}

beforeEach(() => {
  orderStore.reset();
  stopAllStatusProgressions();
  vi.useFakeTimers();
});

afterEach(() => {
  stopAllStatusProgressions();
  vi.useRealTimers();
});

describe("nextStatus", () => {
  it("returns each following status in the lifecycle", () => {
    expect(nextStatus("ORDER_RECEIVED")).toBe("PREPARING");
    expect(nextStatus("PREPARING")).toBe("OUT_FOR_DELIVERY");
    expect(nextStatus("OUT_FOR_DELIVERY")).toBe("DELIVERED");
  });

  it("returns undefined for DELIVERED, making it terminal", () => {
    expect(nextStatus("DELIVERED")).toBeUndefined();
  });

  it("walks the whole lifecycle in exactly the documented order", () => {
    const walked: OrderStatus[] = ["ORDER_RECEIVED"];

    let current = nextStatus("ORDER_RECEIVED");
    while (current) {
      walked.push(current);
      current = nextStatus(current);
    }

    expect(walked).toEqual([
      "ORDER_RECEIVED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ]);
  });

  it("is pure — repeated calls give the same answer and touch nothing", () => {
    expect(nextStatus("PREPARING")).toBe(nextStatus("PREPARING"));
    expect(orderStore.count()).toBe(0);
  });

  it("agrees with isValidTransition for every pair of statuses", () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        expect(isValidTransition(from, to)).toBe(nextStatus(from) === to);
      }
    }
  });
});

describe("automatic progression", () => {
  it("leaves a new order alone until the first interval elapses", () => {
    const order = createOrder(validInput);

    vi.advanceTimersByTime(config.statusStepMs - 1);

    expect(getOrder(order.id).status).toBe("ORDER_RECEIVED");
  });

  it("advances one status per interval", () => {
    const order = createOrder(validInput);

    advanceOneStep();
    expect(getOrder(order.id).status).toBe("PREPARING");

    advanceOneStep();
    expect(getOrder(order.id).status).toBe("OUT_FOR_DELIVERY");

    advanceOneStep();
    expect(getOrder(order.id).status).toBe("DELIVERED");
  });

  it("stops at DELIVERED and schedules nothing further", () => {
    const order = createOrder(validInput);

    for (let step = 0; step < 3; step += 1) {
      advanceOneStep();
    }

    expect(getOrder(order.id).status).toBe("DELIVERED");
    expect(pendingProgressionCount()).toBe(0);

    // Far more time than the whole lifecycle needs.
    vi.advanceTimersByTime(config.statusStepMs * 10);

    expect(getOrder(order.id).status).toBe("DELIVERED");
  });

  it("refreshes updatedAt but never createdAt", () => {
    const order = createOrder(validInput);

    advanceOneStep();
    const advanced = getOrder(order.id);

    expect(advanced.createdAt).toBe(order.createdAt);
    expect(Date.parse(advanced.updatedAt)).toBeGreaterThan(
      Date.parse(order.createdAt),
    );
  });

  it("leaves the rest of the order untouched", () => {
    const order = createOrder(validInput);

    advanceOneStep();
    const advanced = getOrder(order.id);

    expect(advanced.id).toBe(order.id);
    expect(advanced.items).toEqual(order.items);
    expect(advanced.total).toBe(order.total);
    expect(advanced.customer).toEqual(order.customer);
  });

  it("progresses several orders independently", () => {
    const first = createOrder(validInput);
    advanceOneStep();
    const second = createOrder(validInput);
    advanceOneStep();

    expect(getOrder(first.id).status).toBe("OUT_FOR_DELIVERY");
    expect(getOrder(second.id).status).toBe("PREPARING");
  });
});

describe("timer management", () => {
  it("tracks one pending step per in-flight order", () => {
    createOrder(validInput);
    createOrder(validInput);

    expect(pendingProgressionCount()).toBe(2);
  });

  it("cancelStatusProgression freezes a single order", () => {
    const order = createOrder(validInput);

    cancelStatusProgression(order.id);
    vi.advanceTimersByTime(config.statusStepMs * 5);

    expect(getOrder(order.id).status).toBe("ORDER_RECEIVED");
    expect(pendingProgressionCount()).toBe(0);
  });

  it("stopAllStatusProgressions clears every timer", () => {
    createOrder(validInput);
    createOrder(validInput);

    stopAllStatusProgressions();

    expect(pendingProgressionCount()).toBe(0);
  });

  it("does not schedule anything for an unknown order", () => {
    scheduleStatusProgression("no-such-order");

    expect(pendingProgressionCount()).toBe(0);
  });

  it("does not double-schedule when called twice for one order", () => {
    const order = createOrder(validInput);

    scheduleStatusProgression(order.id);
    scheduleStatusProgression(order.id);

    expect(pendingProgressionCount()).toBe(1);

    advanceOneStep();
    expect(getOrder(order.id).status).toBe("PREPARING");
  });

  it("drops the timer when the order disappears before it fires", () => {
    createOrder(validInput);

    orderStore.reset();
    vi.advanceTimersByTime(config.statusStepMs * 5);

    expect(pendingProgressionCount()).toBe(0);
  });
});
