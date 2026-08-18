const DEFAULT_PORT = 3001;
const DEFAULT_STATUS_STEP_MS = 15_000;

/** Parses a port from an env value, falling back to the default when absent or invalid. */
export function resolvePort(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

/** How long an order sits on each status before the simulator advances it. */
export function resolveStatusStepMs(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_STATUS_STEP_MS;
}

export const config = {
  port: resolvePort(process.env.PORT),
  statusStepMs: resolveStatusStepMs(process.env.STATUS_STEP_MS),
};
