import { formatPrice } from "../lib/format";
import { buttonPrimary } from "../lib/ui";
import type { MenuItemCardProps } from "../types";

export default function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Fixed aspect ratio keeps the grid even and survives a failed image. */}
      <div className="aspect-4/3 overflow-hidden bg-line">
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-bold leading-snug tracking-tight">
          {item.name}
        </h3>

        <p className="flex-1 text-sm leading-relaxed text-muted">
          {item.description}
        </p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-lg font-extrabold tracking-tight text-primary xl:text-xl">
            {formatPrice(item.price)}
          </span>

          <button
            type="button"
            aria-label={`Add ${item.name} to cart`}
            onClick={() => onAdd(item)}
            className={`${buttonPrimary} shrink-0 whitespace-nowrap px-3.5 py-2 text-sm`}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
