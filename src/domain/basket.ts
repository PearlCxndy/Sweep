import type { Product, TripItem } from "./types";

export type Basket = {
  /** Pence for the lines actually in the trolley. */
  inTrolley: number;
  /** Pence for the lines still to settle — pending, or waiting on a swap. */
  remaining: number;
  /**
   * Lines with no price behind them.
   *
   * Sweep's prices come from a catalogue, not from the till, and a catalogue
   * goes stale. A total that quietly drops what it does not know is worse than
   * one that says so, so the count comes out with the money and the UI hedges.
   */
  unpriced: number;
};

const SETTLED_INTO_TROLLEY: TripItem["status"][] = ["in_trolley"];
const STILL_TO_SETTLE: TripItem["status"][] = ["pending", "not_here"];

/**
 * What the trolley is worth, and what is still to come.
 *
 * A swap replaces the line it stood in for: the original goes `substituted`
 * and the replacement is `in_trolley`, so summing by status counts the swap
 * once, at the price of the thing actually picked up. Skipped lines are worth
 * nothing to either figure — they were not bought and are not coming.
 */
export function basket(items: TripItem[], catalogue: Product[]): Basket {
  const priceOf = new Map(catalogue.map((p) => [p.id, p.price]));
  const total: Basket = { inTrolley: 0, remaining: 0, unpriced: 0 };

  for (const item of items) {
    const inTrolley = SETTLED_INTO_TROLLEY.includes(item.status);
    const toCome = STILL_TO_SETTLE.includes(item.status);
    if (!inTrolley && !toCome) continue;

    const price = priceOf.get(item.productId);
    if (price === undefined) {
      total.unpriced += 1;
      continue;
    }

    const line = price * item.quantity;
    if (inTrolley) total.inTrolley += line;
    else total.remaining += line;
  }

  return total;
}
