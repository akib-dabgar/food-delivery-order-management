import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const app = createApp();

describe("GET /api/health", () => {
  it("reports that the server is up", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("unknown routes", () => {
  it("returns 404 in the uniform error shape", async () => {
    const response = await request(app).get("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.error.message).toContain("/api/does-not-exist");
  });
});

describe("malformed request bodies", () => {
  it("returns 400 rather than crashing on invalid JSON", async () => {
    const response = await request(app)
      .post("/api/menu")
      .set("Content-Type", "application/json")
      .send("{ not valid json");

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Malformed JSON body");
  });
});
