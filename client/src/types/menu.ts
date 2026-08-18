/** A single item on the restaurant menu, as returned by GET /api/menu. */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}
