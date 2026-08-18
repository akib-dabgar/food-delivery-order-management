/** One line in the cart. Merged by menuItemId, never duplicated. */
export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  /** Copied from the menu item so the cart can show a thumbnail. */
  imageUrl: string;
}
