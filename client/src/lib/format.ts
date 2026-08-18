/** Displays money consistently. Kept dependency-free so tests match exactly. */
export function formatPrice(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}
