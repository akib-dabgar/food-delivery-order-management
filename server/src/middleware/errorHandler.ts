import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../errors.js";
import type { ApiError } from "../types/index.js";

/** Runs when no route matched. Mounted last, before the error handler. */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ApiError = {
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  };

  res.status(404).json(body);
};

/** Single place that turns a thrown error into the uniform API error shape. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ApiError = {
      error: { message: err.message, details: err.details },
    };

    res.status(err.status).json(body);
    return;
  }

  // express.json() throws a SyntaxError carrying the raw body when parsing fails.
  if (err instanceof SyntaxError && "body" in err) {
    const body: ApiError = { error: { message: "Malformed JSON body" } };

    res.status(400).json(body);
    return;
  }

  console.error("Unhandled error:", err);

  const body: ApiError = { error: { message: "Internal server error" } };

  res.status(500).json(body);
};
