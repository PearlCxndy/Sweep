"use client";

export type Coords = { lat: number; lng: number };

/**
 * Asked at the moment of use, never at app open.
 *
 * Denial resolves to null rather than rejecting. A refusal is not an error —
 * it is someone making a reasonable choice — and the postcode path is a
 * first-class alternative, not a punishment.
 */
export async function requestLocation(): Promise<Coords | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return null;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 300_000 },
    );
  });
}
