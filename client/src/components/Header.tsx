import { Link } from "react-router-dom";
import { useCart } from "../cart/CartContext";
import { BowlIcon } from "./icons";

/** Sticky top bar: brand mark, app name, and a live cart count. */
export default function Header() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <h1 className="text-lg font-bold tracking-tight sm:text-xl">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80"
          >
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-sm">
              <BowlIcon />
            </span>
            <span>Food Ordering App</span>
          </Link>
        </h1>

        {itemCount > 0 && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {itemCount} in cart
          </span>
        )}
      </div>
    </header>
  );
}
