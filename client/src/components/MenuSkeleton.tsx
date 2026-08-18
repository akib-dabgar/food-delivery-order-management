import { panel } from "../lib/ui";

/**
 * Placeholder grid shown while the menu loads, so the page keeps its shape
 * instead of collapsing and then jumping when the data lands.
 */
export default function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={`${panel} overflow-hidden`}>
          <div className="aspect-4/3 animate-pulse bg-line" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
            <div className="h-3 w-full animate-pulse rounded bg-line" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
