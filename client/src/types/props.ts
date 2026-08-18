import type { CartLine } from "./cart";
import type { MenuItem } from "./menu";
import type { Customer, OrderStatus } from "./order";

/** Props for every component that takes them, kept in one place. */

export interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export interface CartItemRowProps {
  line: CartLine;
  onIncrease: (menuItemId: string) => void;
  onDecrease: (menuItemId: string) => void;
  onRemove: (menuItemId: string) => void;
}

export interface CheckoutFormProps {
  onSubmit: (customer: Customer) => void;
  submitting: boolean;
  serverError?: string;
}

export interface StatusTrackerProps {
  status: OrderStatus;
}

export interface IconProps {
  className?: string;
}
