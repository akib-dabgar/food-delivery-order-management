import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { menuItems } from "../data/menu.js";
import { orderStore } from "../store/orderStore.js";
import { stopAllStatusProgressions } from "../services/statusSimulator.js";
import type { Order } from "../types/index.js";

const app = createApp();

const validPayload = {
  customer: {
    name: "Asha Rao",
    address: "12 Park Lane, Springfield",
    phone: "9876543210",
  },
  items: [{ menuItemId: "m1", quantity: 2 }],
};

/** Places a valid order and returns it, for tests that need one to exist. */
async function placeOrder(): Promise<Order> {
  const response = await request(app).post("/api/orders").send(validPayload);

  expect(response.status).toBe(201);
  return response.body as Order;
}

beforeEach(() => {
  orderStore.reset();
  stopAllStatusProgressions();
});

afterEach(() => {
  // Placing an order schedules a real timer; stop it so tests never hang.
  stopAllStatusProgressions();
});

describe("POST /api/orders", () => {
  it("creates an order and returns 201 with the stored representation", async () => {
    const response = await request(app).post("/api/orders").send(validPayload);
    const order = response.body as Order;

    expect(response.status).toBe(201);
    expect(order.id).toEqual(expect.any(String));
    expect(order.status).toBe("ORDER_RECEIVED");
    expect(order.customer).toEqual(validPayload.customer);
    expect(order.createdAt).toEqual(expect.any(String));
    expect(orderStore.count()).toBe(1);
  });

  it("computes the total from menu prices", async () => {
    const first = menuItems[0]!;
    const second = menuItems[1]!;

    const response = await request(app)
      .post("/api/orders")
      .send({
        customer: validPayload.customer,
        items: [
          { menuItemId: first.id, quantity: 2 },
          { menuItemId: second.id, quantity: 1 },
        ],
      });

    const order = response.body as Order;

    expect(order.total).toBe(first.price * 2 + second.price);
    expect(order.items).toHaveLength(2);
    expect(order.items[0]?.name).toBe(first.name);
    expect(order.items[0]?.price).toBe(first.price);
  });

  it("ignores a price sent by the client", async () => {
    const menuItem = menuItems[0]!;

    const response = await request(app)
      .post("/api/orders")
      .send({
        customer: validPayload.customer,
        items: [{ menuItemId: menuItem.id, quantity: 1, price: 1 }],
        total: 1,
      });

    const order = response.body as Order;

    expect(response.status).toBe(201);
    expect(order.items[0]?.price).toBe(menuItem.price);
    expect(order.total).toBe(menuItem.price);
  });

  it("accepts names that use full stops, apostrophes and hyphens", async () => {
    for (const name of ["Akib Dabgar", "M. K. Sharma", "D'Souza", "Anne-Marie"]) {
      orderStore.reset();

      const response = await request(app)
        .post("/api/orders")
        .send({
          customer: { ...validPayload.customer, name },
          items: validPayload.items,
        });

      expect(response.status, `name "${name}" should be accepted`).toBe(201);
    }
  });

  it("accepts a 10-digit phone written with spaces or a +91 prefix", async () => {
    for (const phone of ["9876543210", "98765 43210", "+91 98765 43210", "098765 43210"]) {
      orderStore.reset();

      const response = await request(app)
        .post("/api/orders")
        .send({
          customer: { ...validPayload.customer, phone },
          items: validPayload.items,
        });

      expect(response.status, `phone "${phone}" should be accepted`).toBe(201);
    }
  });

  it("trims surrounding whitespace on customer fields", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        customer: {
          name: "  Asha Rao  ",
          address: "  12 Park Lane, Springfield  ",
          phone: "  9876543210  ",
        },
        items: validPayload.items,
      });

    expect(response.status).toBe(201);
    expect((response.body as Order).customer.name).toBe("Asha Rao");
  });

  it("rejects an unknown menu item with 400 and stores nothing", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        customer: validPayload.customer,
        items: [{ menuItemId: "does-not-exist", quantity: 1 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("does-not-exist");
    expect(orderStore.count()).toBe(0);
  });

  describe("validation", () => {
    const cases: { name: string; body: object }[] = [
      { name: "an empty body", body: {} },
      { name: "a missing customer", body: { items: validPayload.items } },
      {
        name: "a missing name",
        body: {
          customer: { address: "12 Park Lane", phone: "9876543210" },
          items: validPayload.items,
        },
      },
      {
        name: "a blank name",
        body: {
          customer: { ...validPayload.customer, name: "   " },
          items: validPayload.items,
        },
      },
      {
        name: "a blank address",
        body: {
          customer: { ...validPayload.customer, address: "   " },
          items: validPayload.items,
        },
      },
      {
        name: "an address that is too short",
        body: {
          customer: { ...validPayload.customer, address: "12" },
          items: validPayload.items,
        },
      },
      {
        name: "a blank phone",
        body: {
          customer: { ...validPayload.customer, phone: "   " },
          items: validPayload.items,
        },
      },
      {
        name: "a phone containing letters",
        body: {
          customer: { ...validPayload.customer, phone: "call-me-now" },
          items: validPayload.items,
        },
      },
      {
        name: "a phone with too few digits",
        body: {
          customer: { ...validPayload.customer, phone: "12345" },
          items: validPayload.items,
        },
      },
      {
        name: "a phone with nine digits",
        body: {
          customer: { ...validPayload.customer, phone: "987654321" },
          items: validPayload.items,
        },
      },
      {
        name: "a phone with eleven digits",
        body: {
          customer: { ...validPayload.customer, phone: "98765432109" },
          items: validPayload.items,
        },
      },
      {
        name: "a name containing digits",
        body: {
          customer: { ...validPayload.customer, name: "Akib123" },
          items: validPayload.items,
        },
      },
      {
        name: "a name that is only digits",
        body: {
          customer: { ...validPayload.customer, name: "12345" },
          items: validPayload.items,
        },
      },
      {
        name: "a name with a symbol",
        body: {
          customer: { ...validPayload.customer, name: "Akib@Dabgar" },
          items: validPayload.items,
        },
      },
      {
        name: "a non-string name",
        body: {
          customer: { ...validPayload.customer, name: 42 },
          items: validPayload.items,
        },
      },
      {
        name: "missing items",
        body: { customer: validPayload.customer },
      },
      {
        name: "an empty items array",
        body: { customer: validPayload.customer, items: [] },
      },
      {
        name: "a missing menuItemId",
        body: { customer: validPayload.customer, items: [{ quantity: 1 }] },
      },
      {
        name: "a quantity of zero",
        body: {
          customer: validPayload.customer,
          items: [{ menuItemId: "m1", quantity: 0 }],
        },
      },
      {
        name: "a negative quantity",
        body: {
          customer: validPayload.customer,
          items: [{ menuItemId: "m1", quantity: -3 }],
        },
      },
      {
        name: "a fractional quantity",
        body: {
          customer: validPayload.customer,
          items: [{ menuItemId: "m1", quantity: 1.5 }],
        },
      },
      {
        name: "a quantity beyond the allowed maximum",
        body: {
          customer: validPayload.customer,
          items: [{ menuItemId: "m1", quantity: 5000 }],
        },
      },
      {
        name: "a quantity sent as a string",
        body: {
          customer: validPayload.customer,
          items: [{ menuItemId: "m1", quantity: "2" }],
        },
      },
    ];

    for (const { name, body } of cases) {
      it(`returns 400 and creates no order for ${name}`, async () => {
        const response = await request(app).post("/api/orders").send(body);

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("Invalid order payload");
        expect(Array.isArray(response.body.error.details)).toBe(true);
        expect(orderStore.count()).toBe(0);
      });
    }

    it("reports which field failed", async () => {
      const response = await request(app)
        .post("/api/orders")
        .send({
          customer: { ...validPayload.customer, name: "" },
          items: validPayload.items,
        });

      const paths = (response.body.error.details as { path: string }[]).map(
        (detail) => detail.path,
      );

      expect(paths).toContain("customer.name");
    });
  });
});

describe("GET /api/orders/:id", () => {
  it("returns the stored order", async () => {
    const order = await placeOrder();
    const response = await request(app).get(`/api/orders/${order.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(order);
  });

  it("returns 404 for an unknown id", async () => {
    const response = await request(app).get("/api/orders/missing-id");

    expect(response.status).toBe(404);
    expect(response.body.error.message).toContain("missing-id");
  });
});

describe("PATCH /api/orders/:id/status", () => {
  it("advances the order to the next status", async () => {
    const order = await placeOrder();

    const response = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .send({ status: "PREPARING" });

    expect(response.status).toBe(200);
    expect((response.body as Order).status).toBe("PREPARING");
  });

  it("walks the whole lifecycle one step at a time", async () => {
    const order = await placeOrder();

    for (const status of ["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"]) {
      const response = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .send({ status });

      expect(response.status).toBe(200);
      expect((response.body as Order).status).toBe(status);
    }
  });

  it("rejects a status value outside the lifecycle", async () => {
    const order = await placeOrder();

    const response = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .send({ status: "CANCELLED" });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Invalid status payload");
  });

  it("rejects a missing status", async () => {
    const order = await placeOrder();

    const response = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("rejects skipping a step and leaves the order unchanged", async () => {
    const order = await placeOrder();

    const response = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .send({ status: "DELIVERED" });

    expect(response.status).toBe(400);

    const after = await request(app).get(`/api/orders/${order.id}`);
    expect((after.body as Order).status).toBe("ORDER_RECEIVED");
  });

  it("rejects moving backwards", async () => {
    const order = await placeOrder();
    await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .send({ status: "PREPARING" });

    const response = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .send({ status: "ORDER_RECEIVED" });

    expect(response.status).toBe(400);
  });

  it("refuses to move past DELIVERED", async () => {
    const order = await placeOrder();

    for (const status of ["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"]) {
      await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .send({ status });
    }

    const response = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .send({ status: "DELIVERED" });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("DELIVERED");
  });

  it("returns 404 for an unknown id", async () => {
    const response = await request(app)
      .patch("/api/orders/missing-id/status")
      .send({ status: "PREPARING" });

    expect(response.status).toBe(404);
  });
});
