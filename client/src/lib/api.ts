import type { CreateOrderRequest, MenuItem, Order } from "../types";

const API_BASE = "/api";

interface ErrorBody {
  error?: {
    message?: string;
    details?: { path?: string; message?: string }[];
  };
}

/** Pulls the message out of the server error shape, falling back to the status. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    const message = body.error?.message;
    const details = body.error?.details;

    if (Array.isArray(details)) {
      const detail = details
        .map((issue) => issue?.message)
        .filter(Boolean)
        .join(", ");

      if (detail) {
        return message ? `${message}: ${detail}` : detail;
      }
    }

    if (message) {
      return message;
    }
  } catch {
    // Body was not JSON; fall through to the generic message.
  }

  return `Request failed with status ${response.status}`;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }

  return (await response.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }

  return (await response.json()) as T;
}

export function fetchMenu(): Promise<MenuItem[]> {
  return getJson<MenuItem[]>("/menu");
}

export function createOrder(request: CreateOrderRequest): Promise<Order> {
  return postJson<Order>("/orders", request);
}

export function fetchOrder(id: string): Promise<Order> {
  return getJson<Order>(`/orders/${encodeURIComponent(id)}`);
}
