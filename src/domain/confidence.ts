import type { Confidence, Purchase } from "./types";

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

const DAY_MS = 86_400_000;

export function daysBetween(from: string | Date, to: string | Date): number {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

function startOfDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Day gaps between consecutive purchases, oldest first. */
export function intervalsOf(purchases: Purchase[]): number[] {
  const dates = purchases
    .map((p) => p.date)
    .sort((a, b) => a.localeCompare(b));
  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    gaps.push(daysBetween(dates[i - 1], dates[i]));
  }
  return gaps;
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Evidence strength, never a percentage.
 * Renders as a three-dot meter, so the scale is deliberately coarse.
 */
export function confidenceOf(
  purchases: Purchase[],
  today: Date,
): Confidence {
  const observations = purchases.length;
  if (observations < 2) return "low";

  const intervals = intervalsOf(purchases);
  const medianInterval = median(intervals);
  if (medianInterval <= 0) return "low";

  const consistency = clamp01(1 - stdev(intervals) / medianInterval);

  const last = purchases
    .map((p) => p.date)
    .sort((a, b) => a.localeCompare(b))
    .at(-1)!;
  const recency = daysBetween(last, today) <= 2 * medianInterval;

  if (observations >= 8 && consistency >= 0.6 && recency) return "high";
  if (observations >= 4 && consistency >= 0.35) return "medium";
  return "low";
}

export const CONFIDENCE_METER: Record<Confidence, string> = {
  high: "●●●",
  medium: "●●○",
  low: "●○○",
};

export const CONFIDENCE_RANK: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};
