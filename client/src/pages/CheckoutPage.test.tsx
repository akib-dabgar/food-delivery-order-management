import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "../cart/CartContext";
import type { MenuItem, Order } from "../types";
import CheckoutPage from "./CheckoutPage";
import { jsonResponse } from "../test/helpers";

const pizza: MenuItem = {
  id: "m1",
  name: "Margherita Pizza",
  description: "Tomato, basil, mozzarella.",
  price: 249,
  imageUrl: "https://example.test/pizza.png",
};

const wrap: MenuItem = {
  id: "m2",
  name: "Paneer Tikka Wrap",
  description: "Charred paneer in a soft roti.",
  price: 189,
  imageUrl: "https://example.test/wrap.png",
};

const placedOrder: Order = {
  id: "order-123",
  customer: { name: "Asha Rao", address: "12 Park Lane", phone: "9876543210" },
  items: [{ menuItemId: "m1", name: "Margherita Pizza", price: 249, quantity: 2 }],
  total: 498,
  status: "ORDER_RECEIVED",
  createdAt: "2026-08-18T10:00:00.000Z",
  updatedAt: "2026-08-18T10:00:00.000Z",
};

type SeedEntry = { item: MenuItem; times: number };

/** Fills the cart once, after mount, so no state is written during render. */
function Seed({ entries }: { entries: SeedEntry[] }) {
  const { addItem } = useCart();
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) {
      return;
    }

    seeded.current = true;

    for (const entry of entries) {
      for (let n = 0; n < entry.times; n += 1) {
        addItem(entry.item);
      }
    }
  }, [addItem, entries]);

  return null;
}

/** Always visible, so cart state can be asserted after navigation. */
function CartProbe() {
  const { itemCount } = useCart();
  return <p>Cart count: {itemCount}</p>;
}

function renderCheckout(entries: SeedEntry[] = [{ item: pizza, times: 2 }]) {
  return render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <CartProvider>
        <Seed entries={entries} />
        <CartProbe />
        <Routes>
          <Route path="/" element={<p>Menu page</p>} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:id" element={<p>Order page reached</p>} />
        </Routes>
      </CartProvider>
    </MemoryRouter>,
  );
}

function fillForm({
  name = "Asha Rao",
  address = "12 Park Lane, Springfield",
  phone = "9876543210",
}: Partial<{ name: string; address: string; phone: string }> = {}) {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Delivery address"), {
    target: { value: address },
  });
  fireEvent.change(screen.getByLabelText("Phone number"), {
    target: { value: phone },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Place order" }));
}

function requestBody(mock: ReturnType<typeof vi.fn>): string {
  const [, init] = mock.mock.calls[0] as [string, RequestInit];
  return init.body as string;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => jsonResponse(placedOrder, true, 201));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkout with an empty cart", () => {
  it("blocks checkout and points back to the menu", () => {
    renderCheckout([]);

    expect(
      screen.getByText(/your cart is empty, so there is nothing to check out/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Place order" }),
    ).not.toBeInTheDocument();
  });
});

describe("checkout form", () => {
  it("shows the order summary from the cart", () => {
    renderCheckout([
      { item: pizza, times: 2 },
      { item: wrap, times: 1 },
    ]);

    expect(screen.getByText("Margherita Pizza × 2")).toBeInTheDocument();
    expect(screen.getByText("Paneer Tikka Wrap × 1")).toBeInTheDocument();
    expect(screen.getByText("Total ₹687.00")).toBeInTheDocument();
  });

  it("renders the three customer fields", () => {
    renderCheckout();

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Delivery address")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
  });

  it("reports every empty field and sends nothing", () => {
    renderCheckout();

    submit();

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Address is required")).toBeInTheDocument();
    expect(screen.getByText("Phone number is required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects whitespace-only values", () => {
    renderCheckout();
    fillForm({ name: "   ", address: "   ", phone: "   " });

    submit();

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a name containing digits", () => {
    renderCheckout();
    fillForm({ name: "Akib123" });

    submit();

    expect(
      screen.getByText("Name may only contain letters"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a name with a full stop, apostrophe or hyphen", async () => {
    renderCheckout();
    fillForm({ name: "M. K. D'Souza-Rao" });

    submit();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it("rejects an address that is too short", () => {
    renderCheckout();
    fillForm({ address: "12" });

    submit();

    expect(
      screen.getByText("Address must be at least 5 characters"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a phone containing letters", () => {
    renderCheckout();
    fillForm({ phone: "call-me" });

    submit();

    expect(
      screen.getByText("Phone may only contain digits and + - ( )"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a phone with too few digits", () => {
    renderCheckout();
    fillForm({ phone: "12345" });

    submit();

    expect(
      screen.getByText("Phone must be a 10-digit mobile number"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a phone with more than 10 digits", () => {
    renderCheckout();
    fillForm({ phone: "98765432109" });

    submit();

    expect(
      screen.getByText("Phone must be a 10-digit mobile number"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a 10-digit number written with spaces", async () => {
    renderCheckout();
    fillForm({ phone: "98765 43210" });

    submit();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it("accepts a number with the +91 country code", async () => {
    renderCheckout();
    fillForm({ phone: "+91 98765 43210" });

    submit();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it("moves focus to the first invalid field on submit", () => {
    renderCheckout();

    submit();

    expect(screen.getByLabelText("Name")).toHaveFocus();
  });

  it("focuses the first field that is actually invalid", () => {
    renderCheckout();
    fillForm({ phone: "nope" });

    submit();

    expect(screen.getByLabelText("Phone number")).toHaveFocus();
  });

  it("clears a field error as soon as the user edits that field", () => {
    renderCheckout();

    submit();
    expect(screen.getByText("Name is required")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Asha" },
    });

    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });
});

describe("placing the order", () => {
  it("sends only menu item ids and quantities", async () => {
    renderCheckout([
      { item: pizza, times: 2 },
      { item: wrap, times: 1 },
    ]);
    fillForm();

    submit();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("/api/orders");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      customer: {
        name: "Asha Rao",
        address: "12 Park Lane, Springfield",
        phone: "9876543210",
      },
      items: [
        { menuItemId: "m1", quantity: 2 },
        { menuItemId: "m2", quantity: 1 },
      ],
    });
  });

  it("never sends a price or a total", async () => {
    renderCheckout();
    fillForm();

    submit();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const raw = requestBody(fetchMock);

    expect(raw).not.toContain("price");
    expect(raw).not.toContain("total");
    expect(raw).not.toContain("249");
  });

  it("trims the customer details before sending them", async () => {
    renderCheckout();
    fillForm({ name: "  Asha Rao  ", address: "  12 Park Lane, Springfield  " });

    submit();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const body = JSON.parse(requestBody(fetchMock)) as {
      customer: { name: string; address: string };
    };

    expect(body.customer.name).toBe("Asha Rao");
    expect(body.customer.address).toBe("12 Park Lane, Springfield");
  });

  it("navigates to the order page once the order is created", async () => {
    renderCheckout();
    fillForm();

    submit();

    expect(await screen.findByText("Order page reached")).toBeInTheDocument();
  });

  it("empties the cart after a successful order", async () => {
    renderCheckout();

    expect(screen.getByText("Cart count: 2")).toBeInTheDocument();

    fillForm();
    submit();
    await screen.findByText("Order page reached");

    expect(screen.getByText("Cart count: 0")).toBeInTheDocument();
  });

  it("disables the submit button while the request is in flight", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    renderCheckout();
    fillForm();

    submit();

    expect(
      await screen.findByRole("button", { name: "Placing order…" }),
    ).toBeDisabled();
  });

  it("shows the server error and keeps the user on the form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            error: {
              message: "Invalid order payload",
              details: [{ path: "customer.phone", message: "phone is invalid" }],
            },
          },
          false,
          400,
        ),
      ),
    );

    renderCheckout();
    fillForm();

    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid order payload: phone is invalid",
    );
    expect(screen.queryByText("Order page reached")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
  });

  it("keeps the cart when the order fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: { message: "Boom" } }, false, 500)),
    );

    renderCheckout();
    fillForm();

    submit();
    await screen.findByRole("alert");

    expect(screen.getByText("Cart count: 2")).toBeInTheDocument();
    expect(screen.getByText("Margherita Pizza × 2")).toBeInTheDocument();
  });
});
