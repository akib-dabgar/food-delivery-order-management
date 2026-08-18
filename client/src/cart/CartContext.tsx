import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { CartLine, MenuItem } from "../types";

/** Matches the server schema, which rejects a quantity above 50. */
export const MAX_LINE_QUANTITY = 50;

export type CartAction =
  | { type: "ADD_ITEM"; item: MenuItem }
  | { type: "INCREASE"; menuItemId: string }
  | { type: "DECREASE"; menuItemId: string }
  | { type: "REMOVE"; menuItemId: string }
  | { type: "CLEAR" };

/** Adjusts one line's quantity, dropping the line when it reaches zero. */
function changeQuantity(
  lines: CartLine[],
  menuItemId: string,
  delta: number,
): CartLine[] {
  return lines.flatMap((line) => {
    if (line.menuItemId !== menuItemId) {
      return [line];
    }

    const quantity = Math.min(line.quantity + delta, MAX_LINE_QUANTITY);

    return quantity > 0 ? [{ ...line, quantity }] : [];
  });
}

export function cartReducer(state: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.find(
        (line) => line.menuItemId === action.item.id,
      );

      // Adding the same item again merges into the existing line.
      if (existing) {
        return changeQuantity(state, action.item.id, 1);
      }

      return [
        ...state,
        {
          menuItemId: action.item.id,
          name: action.item.name,
          price: action.item.price,
          quantity: 1,
          imageUrl: action.item.imageUrl,
        },
      ];
    }

    case "INCREASE":
      return changeQuantity(state, action.menuItemId, 1);

    case "DECREASE":
      return changeQuantity(state, action.menuItemId, -1);

    case "REMOVE":
      return state.filter((line) => line.menuItemId !== action.menuItemId);

    case "CLEAR":
      return [];

    default:
      return state;
  }
}

export function cartTotal(lines: CartLine[]): number {
  const total = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  return Math.round(total * 100) / 100;
}

interface CartContextValue {
  lines: CartLine[];
  total: number;
  itemCount: number;
  addItem: (item: MenuItem) => void;
  increase: (menuItemId: string) => void;
  decrease: (menuItemId: string) => void;
  remove: (menuItemId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      total: cartTotal(lines),
      itemCount: lines.reduce((count, line) => count + line.quantity, 0),
      addItem: (item) => dispatch({ type: "ADD_ITEM", item }),
      increase: (menuItemId) => dispatch({ type: "INCREASE", menuItemId }),
      decrease: (menuItemId) => dispatch({ type: "DECREASE", menuItemId }),
      remove: (menuItemId) => dispatch({ type: "REMOVE", menuItemId }),
      clear: () => dispatch({ type: "CLEAR" }),
    }),
    [lines],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
}
