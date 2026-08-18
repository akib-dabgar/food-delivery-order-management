/**
 * An error that already knows its HTTP status. Services throw it and the
 * error handler is the only place that turns it into a response.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}
