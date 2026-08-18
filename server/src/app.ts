import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { menuRouter } from "./routes/menu.routes.js";
import { orderRouter } from "./routes/order.routes.js";

/**
 * Where the built client lands. Resolves the same way from `dist/app.js` in
 * production and from `src/app.ts` under tsx in development.
 */
const DEFAULT_CLIENT_DIR = path.resolve(import.meta.dirname, "../../client/dist");

export interface AppOptions {
  /** Overridden by tests; defaults to the built client next door. */
  clientDir?: string;
}

function isApiRequest(requestPath: string): boolean {
  return requestPath === "/api" || requestPath.startsWith("/api/");
}

/**
 * Builds the Express app without binding a port, so tests can drive it through
 * Supertest and `index.ts` can own the listening.
 */
export function createApp({ clientDir = DEFAULT_CLIENT_DIR }: AppOptions = {}): Express {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/menu", menuRouter);
  app.use("/api/orders", orderRouter);

  const indexHtml = path.join(clientDir, "index.html");

  // Only serves the SPA when a build is actually present, so development and
  // the test suite are unaffected.
  if (existsSync(indexHtml)) {
    app.use(express.static(clientDir));

    // Client-side routes such as /orders/:id must survive a refresh, so any
    // non-API GET that reached this far is answered with the app shell.
    app.use((req, res, next) => {
      if (req.method !== "GET" || isApiRequest(req.path)) {
        next();
        return;
      }

      res.sendFile(indexHtml);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
