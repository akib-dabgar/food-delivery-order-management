import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../cart/CartContext";
import CheckoutForm from "../components/CheckoutForm";
import { createOrder } from "../lib/api";
import { formatPrice } from "../lib/format";
import { linkBack, panel } from "../lib/ui";
import type { Customer } from "../types";

export default function CheckoutPage() {
  const { lines, total, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  async function placeOrder(customer: Customer) {
    setSubmitting(true);
    setServerError("");

    try {
      // Only ids and quantities leave the client; the server prices the order.
      const order = await createOrder({
        customer,
        items: lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
        })),
      });

      clear();
      navigate(`/orders/${order.id}`);
    } catch (caught) {
      setServerError(
        caught instanceof Error ? caught.message : "Could not place the order",
      );
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <section className={`${panel} mx-auto max-w-md p-8 text-center`}>
        <h2 className="text-2xl font-extrabold tracking-tight">Checkout</h2>
        <p className="mt-2 text-sm text-muted">
          Your cart is empty, so there is nothing to check out.
        </p>
        <Link to="/" className={`${linkBack} mt-4`}>
          Back to the menu
        </Link>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section
        aria-labelledby="checkout-heading"
        className={`${panel} p-6`}
      >
        <h2
          id="checkout-heading"
          className="text-2xl font-extrabold tracking-tight"
        >
          Checkout
        </h2>
        <p className="mt-1 mb-5 text-sm text-muted">
          Where should we bring it?
        </p>

        <CheckoutForm
          onSubmit={(customer) => void placeOrder(customer)}
          submitting={submitting}
          serverError={serverError}
        />
      </section>

      <section
        aria-labelledby="summary-heading"
        className={`${panel} p-6`}
      >
        <h2 id="summary-heading" className="text-lg font-bold tracking-tight">
          Order summary
        </h2>

        <ul className="mt-4 space-y-2.5">
          {lines.map((line) => (
            <li
              key={line.menuItemId}
              className="flex justify-between gap-3 text-sm"
            >
              <span className="text-muted">
                {line.name} × {line.quantity}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatPrice(line.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 border-t-2 border-line pt-4 text-xl font-extrabold tracking-tight">
          Total {formatPrice(total)}
        </p>

        <p className="mt-2 text-xs leading-relaxed text-muted">
          The restaurant confirms the final price when the order is placed.
        </p>

        <Link to="/" className={`${linkBack} mt-4`}>
          Back to the menu
        </Link>
      </section>
    </div>
  );
}
