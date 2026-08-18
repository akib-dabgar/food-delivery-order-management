import type { IconProps } from "../types";

/**
 * Every inline SVG in one place.
 *
 * These were previously declared inside the component that happened to need
 * them first, which made those files longer than their actual behaviour and
 * hid the fact that they are reusable. They take no props beyond an optional
 * class so the caller controls size and colour.
 */

/** Brand mark: a bowl with steam. Used by the header. */
export function BowlIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 12h16a8 8 0 0 1-8 8 8 8 0 0 1-8-8Z"
        fill="currentColor"
        opacity=".95"
      />
      <path
        d="M9 6.5c0-1 1-1.2 1-2.2M12 6c0-1.2 1-1.4 1-2.5M15 6.5c0-1 1-1.2 1-2.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Shown in the empty cart state. */
export function EmptyBagIcon({ className = "size-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5.5 8h13l-1 11.5a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5.5 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V6.5a3 3 0 0 1 6 0V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Marks a completed step on the order tracker. */
export function CheckIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Spins while a request is in flight. */
export function SpinnerIcon({ className = "size-4 animate-spin" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity=".3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
