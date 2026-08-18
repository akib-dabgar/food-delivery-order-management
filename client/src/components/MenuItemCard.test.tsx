import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MenuItem } from "../types";
import MenuItemCard from "./MenuItemCard";

const item: MenuItem = {
  id: "m1",
  name: "Margherita Pizza",
  description: "Wood-fired base with tomato and basil.",
  price: 249,
  imageUrl: "https://example.test/pizza.png",
};

describe("MenuItemCard", () => {
  it("shows the name, description and formatted price", () => {
    render(<MenuItemCard item={item} onAdd={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Margherita Pizza" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Wood-fired base with tomato and basil."),
    ).toBeInTheDocument();
    expect(screen.getByText("₹249.00")).toBeInTheDocument();
  });

  it("shows the image with the dish name as alt text", () => {
    render(<MenuItemCard item={item} onAdd={vi.fn()} />);

    const image = screen.getByAltText("Margherita Pizza");

    expect(image).toHaveAttribute("src", "https://example.test/pizza.png");
  });

  it("reports the item when the add button is pressed", () => {
    const onAdd = vi.fn();
    render(<MenuItemCard item={item} onAdd={onAdd} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Add Margherita Pizza to cart" }),
    );

    expect(onAdd).toHaveBeenCalledWith(item);
  });
});
