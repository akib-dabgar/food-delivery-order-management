import { Link } from "react-router-dom";
import { useCart } from "../cart/CartContext";
import { formatPrice } from "../lib/format";
import { buttonPrimary, panel } from "../lib/ui";
import CartItemRow from "./CartItemRow";
import { EmptyBagIcon } from "./icons";

export default function CartPanel() {
  const { lines, total, itemCount, increase, decrease, remove } = useCart();

  return (
    <section
      aria-labelledby="cart-heading"
      className={`${panel} p-5`}
    >
      <h2 id="cart-heading" className="text-lg font-bold tracking-tight">
        Your cart
      </h2>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-bg">
            <EmptyBagIcon />
          </span>
          <p className="text-sm text-muted">
            Your cart is empty. Add something tasty.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-2 divide-y divide-line">
            {lines.map((line) => (
              <CartItemRow
                key={line.menuItemId}
                line={line}
                onIncrease={increase}
                onDecrease={decrease}
                onRemove={remove}
              />
            ))}
          </ul>

          <div className="mt-4 flex items-baseline justify-between border-t-2 border-line pt-4">
            <span className="text-sm text-muted">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Total {formatPrice(total)}
            </span>
          </div>

          {/* Only rendered with a non-empty cart, so checkout cannot be reached empty. */}
          <Link
            to="/checkout"
            className={`${buttonPrimary} mt-4 block px-4 py-3 text-center text-sm`}
          >
            Go to checkout
          </Link>
        </>
      )}
    </section>
  );
}
