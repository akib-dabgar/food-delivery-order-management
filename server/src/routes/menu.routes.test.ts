import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { menuItems } from "../data/menu.js";
import type { MenuItem } from "../types/index.js";

const app = createApp();

describe("GET /api/menu", () => {
  it("returns 200 with a JSON array of every seeded item", async () => {
    const response = await request(app).get("/api/menu");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(menuItems.length);
  });

  it("returns every field the menu UI needs, correctly typed", async () => {
    const response = await request(app).get("/api/menu");
    const items = response.body as MenuItem[];

    expect(items.length).toBeGreaterThan(0);

    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.name).toBe("string");
      expect(typeof item.description).toBe("string");
      expect(typeof item.price).toBe("number");
      expect(typeof item.imageUrl).toBe("string");
    }
  });

  it("serves the seeded data unchanged", async () => {
    const response = await request(app).get("/api/menu");

    expect(response.body).toEqual(menuItems);
  });
});

describe("menu seed data", () => {
  it("gives every item a unique id", () => {
    const ids = menuItems.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no blank name, description or image on any item", () => {
    for (const item of menuItems) {
      expect(item.name.trim()).not.toBe("");
      expect(item.description.trim()).not.toBe("");
      expect(item.imageUrl.trim()).not.toBe("");
    }
  });

  it("prices every item as a positive number", () => {
    for (const item of menuItems) {
      expect(item.price).toBeGreaterThan(0);
      expect(Number.isFinite(item.price)).toBe(true);
    }
  });
});
