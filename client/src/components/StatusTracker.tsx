import { STATUS_LABELS } from "../lib/orderStatus";
import { CheckIcon } from "./icons";
import { ORDER_STATUSES, type StatusTrackerProps } from "../types";

type StepState = "done" | "current" | "pending";

const MARKER: Record<StepState, string> = {
  done: "border-primary bg-primary text-white",
  current: "border-accent bg-accent text-white animate-pulse-ring",
  pending: "border-line bg-surface text-muted",
};

const LABEL: Record<StepState, string> = {
  done: "text-text",
  current: "text-accent-dark font-bold",
  pending: "text-muted",
};

export default function StatusTracker({ status }: StatusTrackerProps) {
  const currentIndex = ORDER_STATUSES.indexOf(status);
  // Once the order is delivered the last step is finished, not in progress, so
  // it reads as done rather than pulsing amber against a green "delivered" banner.
  const finished = currentIndex === ORDER_STATUSES.length - 1;

  return (
    <ol aria-label="Order progress" className="mt-5 space-y-0">
      {ORDER_STATUSES.map((step, index) => {
        const isCurrent = index === currentIndex;
        const state: StepState =
          index < currentIndex || (isCurrent && finished)
            ? "done"
            : isCurrent
              ? "current"
              : "pending";
        const isLast = index === ORDER_STATUSES.length - 1;

        return (
          <li
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            className="flex gap-3"
          >
            {/* Marker column, with the connector drawn between markers. */}
            <div className="flex flex-col items-center">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${MARKER[state]}`}
              >
                {state === "done" ? (
                  <CheckIcon />
                ) : (
                  <span
                    className={`size-2 rounded-full ${
                      state === "current" ? "bg-white" : "bg-muted/40"
                    }`}
                  />
                )}
              </span>

              {!isLast && (
                <span
                  className={`w-0.5 flex-1 ${
                    index < currentIndex ? "bg-primary" : "bg-line"
                  }`}
                />
              )}
            </div>

            <span
              className={`pb-6 text-sm leading-7 ${LABEL[state]} ${isLast ? "pb-0" : ""}`}
            >
              {STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
