import { act, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Order, OrderStatus } from "../types";
import OrderStatusPage, { POLL_INTERVAL_MS } from "./OrderStatusPage";
import { jsonResponse } from "../test/helpers";

function orderWith(status: OrderStatus): Order {
  return {
    id: "order-123",
    customer: {
      name: "Asha Rao",
      address: "12 Park Lane, Springfield",
      phone: "9876543210",
    },
    items: [
      { menuItemId: "m1", name: "Margherita Pizza", price: 249, quantity: 2 },
      { menuItemId: "m2", name: "Paneer Tikka Wrap", price: 189, quantity: 1 },
    ],
    total: 687,
    status,
    createdAt: "2026-08-18T10:00:00.000Z",
    updatedAt: "2026-08-18T10:00:00.000Z",
  };
}

/** Renders the page at /orders/order-123, as a refresh or shared link would. */
function renderOrderPage() {
  return render(
    <MemoryRouter initialEntries={["/orders/order-123"]}>
      <Routes>
        <Route path="/" element={<p>Menu page</p>} />
        <Route path="/orders/:id" element={<OrderStatusPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Lets pending promises settle without advancing the clock. */
async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

/** Advances past one polling interval and lets the response settle. */
async function pollOnce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("loading the order directly by URL", () => {
  it("shows a loading message first", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    renderOrderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Loading your order");
  });

  it("requests the order id taken from the URL", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(orderWith("ORDER_RECEIVED")),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderOrderPage();
    await flush();

    expect(fetchMock).toHaveBeenCalledWith("/api/orders/order-123");
  });

  it("shows the status, items, total and delivery details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(orderWith("ORDER_RECEIVED"))),
    );

    renderOrderPage();
    await flush();

    expect(screen.getByRole("status")).toHaveTextContent("Order received");
    expect(screen.getByText("Margherita Pizza × 2")).toBeInTheDocument();
    expect(screen.getByText("₹498.00")).toBeInTheDocument();
    expect(screen.getByText("Total ₹687.00")).toBeInTheDocument();
    expect(screen.getByText(/order-123/)).toBeInTheDocument();
    expect(screen.getByText(/12 Park Lane, Springfield/)).toBeInTheDocument();
  });

  it("marks the current step on the tracker", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(orderWith("PREPARING"))),
    );

    renderOrderPage();
    await flush();

    const steps = screen.getAllByRole("listitem");

    expect(steps[1]).toHaveTextContent("Preparing");
    expect(steps[1]).toHaveAttribute("aria-current", "step");
    expect(steps[0]).not.toHaveAttribute("aria-current");
  });
});

describe("polling", () => {
  it("picks up a status change on the next poll", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse(orderWith("ORDER_RECEIVED")))
      .mockResolvedValueOnce(jsonResponse(orderWith("PREPARING")))
      .mockResolvedValue(jsonResponse(orderWith("OUT_FOR_DELIVERY")));

    vi.stubGlobal("fetch", fetchMock);

    renderOrderPage();
    await flush();
    expect(screen.getByRole("status")).toHaveTextContent("Order received");

    await pollOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Preparing");

    await pollOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Out for delivery");
  });

  it("does not poll before the interval has elapsed", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(orderWith("ORDER_RECEIVED")),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderOrderPage();
    await flush();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS - 1);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops polling once the order is delivered", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse(orderWith("OUT_FOR_DELIVERY")))
      .mockResolvedValue(jsonResponse(orderWith("DELIVERED")));

    vi.stubGlobal("fetch", fetchMock);

    renderOrderPage();
    await flush();

    await pollOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Delivered");

    const callsAtDelivery = fetchMock.mock.calls.length;

    await pollOnce();
    await pollOnce();
    await pollOnce();

    expect(fetchMock).toHaveBeenCalledTimes(callsAtDelivery);
    expect(screen.getByText(/your order has been delivered/i)).toBeInTheDocument();
  });

  it("stops polling when the component unmounts", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(orderWith("ORDER_RECEIVED")),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderOrderPage();
    await flush();

    const callsBeforeUnmount = fetchMock.mock.calls.length;
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 5);
    });

    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeUnmount);
  });
});

describe("error handling", () => {
  it("shows the server message when the order is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: { message: "Order not found: order-123" } }, false, 404),
      ),
    );

    renderOrderPage();
    await flush();

    expect(screen.getByRole("alert")).toHaveTextContent("Order not found");
  });

  it("stops polling after a failure", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: { message: "Order not found" } }, false, 404),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderOrderPage();
    await flush();

    const callsAfterFailure = fetchMock.mock.calls.length;

    await pollOnce();
    await pollOnce();

    expect(fetchMock).toHaveBeenCalledTimes(callsAfterFailure);
  });

  it("recovers when the user retries", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(
        jsonResponse({ error: { message: "Order not found" } }, false, 404),
      )
      .mockResolvedValue(jsonResponse(orderWith("PREPARING")));

    vi.stubGlobal("fetch", fetchMock);

    renderOrderPage();
    await flush();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Preparing");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
