/**
 * Helpers shared by the UI test suites. Not a spec itself — Vitest only picks
 * up `*.test.ts(x)`, so this file is compiled and typechecked but never run as
 * a test.
 */

/** Builds the minimal Response shape the API client actually touches. */
export function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

/** A response that never settles, for asserting loading states. */
export function pendingResponse(): Promise<Response> {
  return new Promise<Response>(() => {});
}
