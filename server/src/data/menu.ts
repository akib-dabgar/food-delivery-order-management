import type { MenuItem } from "../types/index.js";

/**
 * The in-memory menu. It is seeded once and never mutated, so a frozen module
 * constant is the whole storage layer for menu data.
 *
 * Images are served from the client bundle (client/public/images), so the app
 * has no runtime dependency on an external image host. Photos are from
 * Unsplash under the Unsplash License; see README.md for credits.
 */
export const menuItems: readonly MenuItem[] = Object.freeze([
  {
    id: "m1",
    name: "Margherita Pizza",
    description:
      "Wood-fired sourdough base with San Marzano tomato, fior di latte and fresh basil.",
    price: 249,
    imageUrl: "/images/margherita-pizza.jpg",
  },
  {
    id: "m2",
    name: "Paneer Tikka Wrap",
    description:
      "Charred paneer, mint chutney and pickled onion rolled in a soft whole-wheat roti.",
    price: 189,
    imageUrl: "/images/paneer-tikka-wrap.jpg",
  },
  {
    id: "m3",
    name: "Classic Chicken Burger",
    description:
      "Buttermilk-fried chicken thigh, lettuce, tomato and house mayo in a brioche bun.",
    price: 219,
    imageUrl: "/images/chicken-burger.jpg",
  },
  {
    id: "m4",
    name: "Penne Alfredo",
    description:
      "Penne tossed in a slow-cooked parmesan cream sauce with cracked black pepper.",
    price: 239,
    imageUrl: "/images/penne-alfredo.jpg",
  },
  {
    id: "m5",
    name: "Garden Caesar Salad",
    description:
      "Cos lettuce, herbed croutons, shaved parmesan and a light Caesar dressing.",
    price: 169,
    imageUrl: "/images/caesar-salad.jpg",
  },
  {
    id: "m6",
    name: "Chocolate Lava Cake",
    description:
      "Warm dark chocolate cake with a molten centre, served with vanilla ice cream.",
    price: 149,
    imageUrl: "/images/chocolate-lava-cake.jpg",
  },
]);
