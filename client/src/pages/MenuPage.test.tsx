import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "../cart/CartContext";
import type { MenuItem } from "../types";
import MenuPage from "./MenuPage";
import { jsonResponse } from "../test/helpers";

const menu: MenuItem[] = [
  {
    id: "m1",
    name: "Margherita Pizza",
    description: "Tomato, basil, mozzarella.",
    price: 249,
    imageUrl: "https://example.test/pizza.png",
  },
  {
    id: "m2",
    name: "Paneer Tikka Wrap",
    description: "Charred paneer in a soft roti.",
    price: 189,
    imageUrl: "https://example.test/wrap.png",
  },
];

function renderMenuPage() {
  return render(
    <MemoryRouter>
      <CartProvider>
        <MenuPage />
      </CartProvider>
    </MemoryRouter>,
  );
}

/** Renders the page and waits for the menu to appear. */
async function renderLoadedMenu() {
  renderMenuPage();
  await screen.findByRole("heading", { name: "Margherita Pizza" });
}

function cart() {
  return within(screen.getByRole("region", { name: /your cart/i }));
}

function addToCart(itemName: string) {
  fireEvent.click(
    screen.getByRole("button", { name: `Add ${itemName} to cart` }),
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => jsonResponse(menu)),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("menu loading states", () => {
  it("shows a loading message while the request is in flight", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    renderMenuPage();

    expect(screen.getByRole("status")).toHaveTextContent("Loading menu");
  });

  it("renders every menu item once loaded", async () => {
    await renderLoadedMenu();

    expect(
      screen.getByRole("heading", { name: "Paneer Tikka Wrap" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tomato, basil, mozzarella.")).toBeInTheDocument();
    expect(screen.getByAltText("Margherita Pizza")).toBeInTheDocument();
  });

  it("tells the user when the menu is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse([])),
    );

    renderMenuPage();

    expect(
      await screen.findByText("No menu items are available right now."),
    ).toBeInTheDocument();
  });

  it("shows the server error message when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: { message: "Menu is offline" } }, false, 500),
      ),
    );

    renderMenuPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Menu is offline");
  });

  it("shows a message when the network request throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Network down");
      }),
    );

    renderMenuPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Network down");
  });

  it("recovers when the user retries after a failure", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new Error("Network down"))
      .mockResolvedValueOnce(jsonResponse(menu));

    vi.stubGlobal("fetch", fetchMock);

    renderMenuPage();
    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "Margherita Pizza" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});

describe("cart", () => {
  it("starts empty", async () => {
    await renderLoadedMenu();

    expect(cart().getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it("adds an item and shows it with a total", async () => {
    await renderLoadedMenu();

    addToCart("Margherita Pizza");

    expect(cart().getByText("Margherita Pizza")).toBeInTheDocument();
    expect(cart().getByText(/Total ₹249\.00/)).toBeInTheDocument();
    expect(cart().getByText("1 item")).toBeInTheDocument();
  });

  it("merges the same item into one line instead of duplicating it", async () => {
    await renderLoadedMenu();

    addToCart("Margherita Pizza");
    addToCart("Margherita Pizza");
    addToCart("Margherita Pizza");

    expect(cart().getAllByText("Margherita Pizza")).toHaveLength(1);
    expect(
      cart().getByLabelText("Increase quantity of Margherita Pizza")
        .previousElementSibling,
    ).toHaveTextContent("3");
    expect(cart().getByText(/Total ₹747\.00/)).toBeInTheDocument();
    expect(cart().getByText("3 items")).toBeInTheDocument();
  });

  it("keeps different items on separate lines", async () => {
    await renderLoadedMenu();

    addToCart("Margherita Pizza");
    addToCart("Paneer Tikka Wrap");

    expect(cart().getAllByRole("listitem")).toHaveLength(2);
    expect(cart().getByText(/Total ₹438\.00/)).toBeInTheDocument();
  });

  it("increases the quantity and updates the total", async () => {
    await renderLoadedMenu();

    addToCart("Margherita Pizza");
    fireEvent.click(
      cart().getByRole("button", {
        name: "Increase quantity of Margherita Pizza",
      }),
    );

    expect(cart().getByText(/Total ₹498\.00/)).toBeInTheDocument();
  });

  it("decreases the quantity and updates the total", async () => {
    await renderLoadedMenu();

    addToCart("Margherita Pizza");
    addToCart("Margherita Pizza");
    fireEvent.click(
      cart().getByRole("button", {
        name: "Decrease quantity of Margherita Pizza",
      }),
    );

    expect(cart().getByText(/Total ₹249\.00/)).toBeInTheDocument();
  });

  it("removes the line when the quantity is decreased to zero", async () => {
    await renderLoadedMenu();

    addToCart("Margherita Pizza");
    fireEvent.click(
      cart().getByRole("button", {
        name: "Decrease quantity of Margherita Pizza",
      }),
    );

    expect(cart().queryByRole("listitem")).not.toBeInTheDocument();
    expect(cart().getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it("removes a line outright with the remove button", async () => {
    await renderLoadedMenu();

    addToCart("Margherita Pizza");
    addToCart("Margherita Pizza");
    addToCart("Paneer Tikka Wrap");

    fireEvent.click(
      cart().getByRole("button", { name: "Remove Margherita Pizza from cart" }),
    );

    expect(cart().getAllByRole("listitem")).toHaveLength(1);
    expect(cart().getByText(/Total ₹189\.00/)).toBeInTheDocument();
  });

  it("shows a per-line subtotal alongside the unit price", async () => {
    await renderLoadedMenu();

    addToCart("Paneer Tikka Wrap");
    addToCart("Paneer Tikka Wrap");

    expect(cart().getByText("₹189.00 each")).toBeInTheDocument();
    expect(cart().getByText("₹378.00")).toBeInTheDocument();
  });
});
