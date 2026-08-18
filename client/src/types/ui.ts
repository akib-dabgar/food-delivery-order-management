/**
 * How an async screen is currently doing. Shared so every page that loads from
 * the API describes its states with the same three words.
 */
export type LoadState = "loading" | "ready" | "error";
