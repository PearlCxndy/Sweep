import {
  CONFIDENCE_RANK,
  confidenceOf,
  daysBetween,
  intervalsOf,
  median,
} from "./confidence";
import type { Inference, Purchase, Store, Suggestion } from "./types";

const MAX_SUGGESTIONS = 5;

/**
 * Deterministic replenishment prediction. No model.
 * A product needs at least two purchases before it can have an interval at all.
 *
 * Purchases are scoped to the trip's store: a pattern at one shop is not
 * evidence about another. `exclude` drops anything already on the list —
 * there is nothing to suggest about an item the shopper has already written
 * down.
 */
export function suggestItems(
  purchases: Purchase[],
  today: Date,
  opts: { store: Store; exclude?: string[] },
): Suggestion[] {
  const excluded = new Set(opts.exclude ?? []);
  const byProduct = new Map<string, Purchase[]>();
  for (const p of purchases) {
    if (p.storeId !== opts.store.id) continue;
    if (excluded.has(p.productId)) continue;
    const list = byProduct.get(p.productId) ?? [];
    list.push(p);
    byProduct.set(p.productId, list);
  }

  const out: Suggestion[] = [];

  for (const [productId, list] of byProduct) {
    if (list.length < 2) continue;

    const intervals = intervalsOf(list);
    const medianInterval = median(intervals);
    if (medianInterval <= 0) continue;

    const last = list
      .map((p) => p.date)
      .sort((a, b) => a.localeCompare(b))
      .at(-1)!;
    const daysSince = daysBetween(last, today);

    if (daysSince < medianInterval - 1) continue;

    const confidence = confidenceOf(list, today);
    const rounded = Math.round(medianInterval);

    out.push({
      productId,
      confidence,
      medianInterval: rounded,
      daysSince,
      overdueBy: daysSince - medianInterval,
      observations: list.length,
      reason:
        confidence === "low"
          ? `Bought ${list.length} times. Pattern still unclear.`
          : `You buy this every ${rounded} days. It's been ${daysSince}.`,
    });
  }

  out.sort((a, b) => {
    const byConfidence =
      CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    if (byConfidence !== 0) return byConfidence;
    if (b.overdueBy !== a.overdueBy) return b.overdueBy - a.overdueBy;
    return a.productId.localeCompare(b.productId);
  });

  return out.slice(0, MAX_SUGGESTIONS);
}

/**
 * Products that a deleted inference took out of the picture. A deleted claim
 * is not a hidden row: the products it rested on stop feeding suggestions.
 */
export function excludedByDeletedInferences(
  inferences: Inference[],
  deletedIds: string[],
): string[] {
  const deleted = new Set(deletedIds);
  return [
    ...new Set(
      inferences
        .filter((i) => i.deleted || deleted.has(i.id))
        .flatMap((i) => i.basis),
    ),
  ];
}

/** Turn one down this many times and it stops being offered. */
export const RETIRE_AFTER_DISMISSALS = 3;

/**
 * Products the shopper has turned down often enough to mean it. Dismissing a
 * suggestion once says "not today"; doing it repeatedly says "not ever", and
 * only the second one is worth acting on permanently.
 */
export function retiredByDismissals(
  counts: Record<string, number>,
): string[] {
  return Object.entries(counts)
    .filter(([, n]) => n >= RETIRE_AFTER_DISMISSALS)
    .map(([productId]) => productId);
}
