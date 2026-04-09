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

export type DistanceUnit = "mi" | "km";

const KM_TO_MI = 0.621371;

export function kmToMi(km: number): number {
  return km * KM_TO_MI;
}

export function miToKm(mi: number): number {
  return mi / KM_TO_MI;
}

/** Format distance in km to a human-readable string, using the given unit */
export function formatDistance(km: number, unit: DistanceUnit = "mi"): string {
  if (unit === "mi") {
    const mi = kmToMi(km);
    if (mi < 0.1) {
      return `${Math.round(mi * 5280)} ft away`;
    }
    return `${mi.toFixed(1)} mi away`;
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}
