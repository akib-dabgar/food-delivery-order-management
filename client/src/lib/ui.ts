/**
 * Shared Tailwind class recipes.
 *
 * These are the visual decisions that repeat across pages — surfaces, buttons,
 * links. Keeping them here means a change to "what a primary button looks like"
 * happens once instead of in five components.
 *
 * Each recipe deliberately carries look only, not spacing or size. Callers
 * append their own `px-*`, `py-*` and `text-*` so a compact card button and a
 * full-width checkout button can share one identity without fighting over
 * padding. Values are whole literal strings so Tailwind's scanner still sees
 * every class it needs to generate.
 */

/** A raised content surface: cards, sidebars, form sections. */
export const panel =
  "rounded-2xl border border-line bg-surface shadow-sm";

/** The main call to action. Append size and padding at the call site. */
export const buttonPrimary =
  "rounded-xl bg-primary font-semibold text-white shadow-sm transition duration-150 hover:bg-primary-dark hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-sm disabled:active:scale-100";

/** Small square control, used by the cart quantity stepper. */
export const buttonStepper =
  "grid size-8 place-items-center rounded-lg border border-line bg-surface text-lg leading-none font-semibold transition hover:border-primary hover:text-primary active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-text";

/** Quiet destructive action, e.g. removing a cart line. */
export const buttonQuiet =
  "rounded-md px-1.5 py-1 text-xs font-medium text-muted underline underline-offset-2 transition hover:text-accent-dark";

/** Inline navigation link back to a previous screen. */
export const linkBack =
  "inline-block text-sm font-semibold text-primary underline underline-offset-2 transition hover:text-primary-dark";

/** Error box shown for a failed request or a rejected submission. */
export const errorBox =
  "rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700";
