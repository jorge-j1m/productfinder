/**
 * Format price in cents to a display string.
 * WEIGHT products show "/kg", UNITS products show plain price.
 */
export function formatPrice(
  cents: number,
  stockType?: "WEIGHT" | "UNITS",
): string {
  const dollars = (cents / 100).toFixed(2);
  const formatted = `$${dollars}`;
  return stockType === "WEIGHT" ? `${formatted}/kg` : formatted;
}

/** Format distance in km to a human-readable string */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}
