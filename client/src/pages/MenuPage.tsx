import { useCallback, useEffect, useState } from "react";
import { useCart } from "../cart/CartContext";
import CartPanel from "../components/CartPanel";
import MenuItemCard from "../components/MenuItemCard";
import MenuSkeleton from "../components/MenuSkeleton";
import { fetchMenu } from "../lib/api";
import { buttonPrimary, panel } from "../lib/ui";
import type { LoadState, MenuItem } from "../types";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const { addItem } = useCart();

  const loadMenu = useCallback(async () => {
    setState("loading");

    try {
      setItems(await fetchMenu());
      setState("ready");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load the menu",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-labelledby="menu-heading">
        <div className="mb-5">
          <h2
            id="menu-heading"
            className="text-2xl font-extrabold tracking-tight sm:text-3xl"
          >
            Menu
          </h2>
          <p className="mt-1 text-sm text-muted">
            Freshly made, delivered to your door.
          </p>
        </div>

        {state === "loading" && (
          <>
            <p role="status" className="sr-only">
              Loading menu…
            </p>
            <MenuSkeleton />
          </>
        )}

        {state === "error" && (
          <div className="rounded-2xl border border-accent-dark/25 bg-accent/10 p-5">
            <p role="alert" className="font-semibold text-accent-dark">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadMenu()}
              className={`${buttonPrimary} mt-3 px-4 py-2 text-sm`}
            >
              Try again
            </button>
          </div>
        )}

        {state === "ready" && items.length === 0 && (
          <p className={`${panel} p-8 text-center text-muted`}>
            No menu items are available right now.
          </p>
        )}

        {state === "ready" && items.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} onAdd={addItem} />
            ))}
          </div>
        )}
      </section>

      <div className="lg:sticky lg:top-24">
        <CartPanel />
      </div>
    </div>
  );
}
