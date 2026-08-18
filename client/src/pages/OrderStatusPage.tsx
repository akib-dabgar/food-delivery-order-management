import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusTracker from "../components/StatusTracker";
import { fetchOrder } from "../lib/api";
import { formatPrice } from "../lib/format";
import { STATUS_LABELS } from "../lib/orderStatus";
import { buttonPrimary, errorBox, linkBack, panel } from "../lib/ui";
import type { LoadState, Order } from "../types";

/** How often the page asks the server for the current status. */
export const POLL_INTERVAL_MS = 3000;

/** Turns the last update into a human phrase, refreshed by the caller's tick. */
function agoLabel(updatedAt: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(updatedAt)) / 1000));

  if (seconds < 10) {
    return "updated just now";
  }

  if (seconds < 60) {
    return `updated ${seconds}s ago`;
  }

  return `updated ${Math.floor(seconds / 60)}m ago`;
}

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const stopPolling = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }

    const orderId = id;

    // Guards against a response arriving after the component has gone away.
    let active = true;

    async function load() {
      try {
        const next = await fetchOrder(orderId);

        if (!active) {
          return;
        }

        setOrder(next);
        setState("ready");

        // The lifecycle is over, so there is nothing left to poll for.
        if (next.status === "DELIVERED") {
          stopPolling();
        }
      } catch (caught) {
        if (!active) {
          return;
        }

        setError(
          caught instanceof Error ? caught.message : "Could not load the order",
        );
        setState("error");
        stopPolling();
      }
    }

    void load();
    timerRef.current = setInterval(() => void load(), POLL_INTERVAL_MS);

    return () => {
      active = false;
      stopPolling();
    };
  }, [id, reloadKey, stopPolling]);

  // Drives the "updated Xs ago" text only. Triggers no network activity.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  if (state === "loading") {
    return (
      <section className={`${panel} mx-auto max-w-md p-6 text-center`}>
        <h2 className="text-2xl font-extrabold tracking-tight">Order status</h2>
        <p role="status" className="mt-3 text-sm text-muted">
          Loading your order…
        </p>
      </section>
    );
  }

  if (state === "error" || !order) {
    return (
      <section className={`${panel} mx-auto max-w-md p-6 text-center`}>
        <h2 className="text-2xl font-extrabold tracking-tight">Order status</h2>
        <p
          role="alert"
          className={`${errorBox} mt-3`}
        >
          {error || "Could not load the order"}
        </p>
        <button
          type="button"
          onClick={() => {
            setState("loading");
            setReloadKey((key) => key + 1);
          }}
          className={`${buttonPrimary} mt-4 px-4 py-2.5 text-sm`}
        >
          Try again
        </button>
        <p className="mt-4">
          <Link to="/" className={linkBack}>
            Back to the menu
          </Link>
        </p>
      </section>
    );
  }

  const delivered = order.status === "DELIVERED";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-labelledby="status-heading" className={`${panel} p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="status-heading"
            className="text-lg font-bold tracking-tight text-muted"
          >
            Order status
          </h2>

          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              delivered
                ? "bg-primary/10 text-primary"
                : "bg-accent/15 text-accent-dark"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                delivered ? "bg-primary" : "animate-pulse bg-accent"
              }`}
            />
            {agoLabel(order.updatedAt, now)}
          </span>
        </div>

        <p
          role="status"
          className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          {STATUS_LABELS[order.status]}
        </p>

        <StatusTracker status={order.status} />

        {delivered && (
          <p className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
            Your order has been delivered. Enjoy.
          </p>
        )}
      </section>

      <section aria-labelledby="details-heading" className={`${panel} p-6`}>
        <h2 id="details-heading" className="text-lg font-bold tracking-tight">
          Order details
        </h2>

        <ul className="mt-4 space-y-2.5">
          {order.items.map((item) => (
            <li
              key={item.menuItemId}
              className="flex justify-between gap-3 text-sm"
            >
              <span className="text-muted">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 border-t-2 border-line pt-4 text-2xl font-extrabold tracking-tight text-primary">
          Total {formatPrice(order.total)}
        </p>

        <h3 className="mt-6 text-sm font-bold tracking-tight">Delivering to</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {order.customer.name}
          <br />
          {order.customer.address}
          <br />
          {order.customer.phone}
        </p>

        <p className="mt-5 truncate text-[0.7rem] text-muted/70">
          Order reference: {order.id}
        </p>

        <p className="mt-4">
          <Link to="/" className={linkBack}>
            Back to the menu
          </Link>
        </p>
      </section>
    </div>
  );
}
