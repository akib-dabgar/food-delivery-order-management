import { MAX_LINE_QUANTITY } from "../cart/CartContext";
import { formatPrice } from "../lib/format";
import { buttonQuiet, buttonStepper } from "../lib/ui";
import type { CartItemRowProps } from "../types";

export default function CartItemRow({
  line,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemRowProps) {
  return (
    <li className="flex gap-3 py-3">
      {/* Decorative: the item name is already announced beside it. */}
      <img
        src={line.imageUrl}
        alt=""
        className="size-14 shrink-0 rounded-xl border border-line bg-line object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{line.name}</p>
            <p className="text-xs text-muted">{formatPrice(line.price)} each</p>
          </div>

          <span className="shrink-0 text-sm font-bold tabular-nums">
            {formatPrice(line.price * line.quantity)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={buttonStepper}
              aria-label={`Decrease quantity of ${line.name}`}
              onClick={() => onDecrease(line.menuItemId)}
            >
              −
            </button>

            {/* Kept as the immediate sibling of the increase button. */}
            <span className="w-7 text-center text-sm font-semibold tabular-nums">
              {line.quantity}
            </span>

            <button
              type="button"
              className={buttonStepper}
              aria-label={`Increase quantity of ${line.name}`}
              disabled={line.quantity >= MAX_LINE_QUANTITY}
              onClick={() => onIncrease(line.menuItemId)}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className={buttonQuiet}
            aria-label={`Remove ${line.name} from cart`}
            onClick={() => onRemove(line.menuItemId)}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
