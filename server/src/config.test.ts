import { describe, expect, it } from "vitest";
import { config, resolvePort } from "./config.js";

describe("resolvePort", () => {
  it("uses the default port when the env value is missing", () => {
    expect(resolvePort(undefined)).toBe(3001);
  });

  it("uses the default port when the env value is not a valid port", () => {
    expect(resolvePort("not-a-number")).toBe(3001);
    expect(resolvePort("0")).toBe(3001);
    expect(resolvePort("-1")).toBe(3001);
  });

  it("uses the env value when it is a valid port", () => {
    expect(resolvePort("8080")).toBe(8080);
  });
});

describe("config", () => {
  it("exposes a usable port", () => {
    expect(config.port).toBeGreaterThan(0);
  });
});
