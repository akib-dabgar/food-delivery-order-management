import { describe, expect, it } from "vitest";
import type { CartLine, MenuItem } from "../types";
import { MAX_LINE_QUANTITY, cartReducer, cartTotal } from "./CartContext";

const pizza: MenuItem = {
  id: "m1",
  name: "Margherita Pizza",
  description: "Tomato, basil, mozzarella.",
  price: 249,
  imageUrl: "https://example.test/pizza.png",
};

function line(price: number, quantity: number): CartLine {
  return { menuItemId: "x", name: "x", price, quantity, imageUrl: "" };
}

/**
 * Cart behaviour is covered through the UI in MenuPage.test.tsx. These cover
 * the money arithmetic and immutability, which the UI cannot show directly.
 */
describe("cartTotal", () => {
  it("sums price by quantity", () => {
    expect(cartTotal([line(249, 2), line(189, 1)])).toBe(687);
  });

  it("is zero for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });

  it("rounds away binary floating point error", () => {
    expect(cartTotal([line(0.1, 3)])).toBe(0.3);
    expect(cartTotal([line(10.05, 3)])).toBe(30.15);
  });
});

describe("cartReducer", () => {
  it("does not mutate the previous state", () => {
    const state: CartLine[] = [];
    const next = cartReducer(state, { type: "ADD_ITEM", item: pizza });

    expect(state).toEqual([]);
    expect(next).not.toBe(state);
  });

  it("never lets a line exceed the quantity the server accepts", () => {
    const state = [{ ...line(249, MAX_LINE_QUANTITY), menuItemId: pizza.id }];

    const next = cartReducer(state, { type: "INCREASE", menuItemId: pizza.id });

    expect(next[0]?.quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("still merges an add once the line is at the maximum", () => {
    const state = [{ ...line(249, MAX_LINE_QUANTITY), menuItemId: pizza.id }];

    const next = cartReducer(state, { type: "ADD_ITEM", item: pizza });

    expect(next).toHaveLength(1);
    expect(next[0]?.quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("ignores a decrease for an item that is not in the cart", () => {
    const state = [line(100, 1)];

    expect(cartReducer(state, { type: "DECREASE", menuItemId: "absent" })).toEqual(
      state,
    );
  });
});
