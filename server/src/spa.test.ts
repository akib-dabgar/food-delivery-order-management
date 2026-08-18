import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const SHELL = "<!doctype html><title>Food Ordering App</title><div id=root></div>";

let clientDir: string;

beforeAll(() => {
  clientDir = mkdtempSync(path.join(tmpdir(), "client-dist-"));
  writeFileSync(path.join(clientDir, "index.html"), SHELL);
  mkdirSync(path.join(clientDir, "assets"));
  writeFileSync(path.join(clientDir, "assets", "app.js"), "console.log(1);");
});

afterAll(() => {
  rmSync(clientDir, { recursive: true, force: true });
});

describe("serving the built client", () => {
  it("serves the app shell at the root", async () => {
    const response = await request(createApp({ clientDir })).get("/");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/html/);
    expect(response.text).toContain("id=root");
  });

  it("serves static assets", async () => {
    const response = await request(createApp({ clientDir })).get("/assets/app.js");

    expect(response.status).toBe(200);
    expect(response.text).toContain("console.log");
  });

  it("returns the shell for a client-side route so a refresh works", async () => {
    const response = await request(createApp({ clientDir })).get(
      "/orders/2f1c9a44-1111-2222-3333-444455556666",
    );

    expect(response.status).toBe(200);
    expect(response.text).toContain("id=root");
  });

  it("returns the shell for the checkout route", async () => {
    const response = await request(createApp({ clientDir })).get("/checkout");

    expect(response.status).toBe(200);
    expect(response.text).toContain("id=root");
  });

  it("still serves the API as JSON", async () => {
    const response = await request(createApp({ clientDir })).get("/api/menu");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("does not swallow unknown API routes into the shell", async () => {
    const response = await request(createApp({ clientDir })).get("/api/nope");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body.error.message).toContain("/api/nope");
  });

  it("does not answer non-GET requests with the shell", async () => {
    const response = await request(createApp({ clientDir })).post("/orders/anything");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
  });
});

describe("without a built client", () => {
  it("falls back to a JSON 404 for unknown routes", async () => {
    const app = createApp({ clientDir: path.join(tmpdir(), "no-such-client-dist") });
    const response = await request(app).get("/orders/anything");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
  });

  it("still serves the API", async () => {
    const app = createApp({ clientDir: path.join(tmpdir(), "no-such-client-dist") });
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
