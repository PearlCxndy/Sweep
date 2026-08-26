import { groupByAisle } from "./storeOrder";
import type { WalkContext } from "./storeOrder";
import type { TripItem } from "./types";

export type RouteStop = {
  key: string;
  aisle: number | null;
  section: string;
  /** This stop's place in the store's own order. Feeds "start here". */
  order: number;
  /** Items the shopper wrote down for this aisle. Replacements do not count. */
  total: number;
  /** How many of those are settled — in the trolley, swapped, or skipped. */
  done: number;
  status: "done" | "current" | "ahead";
  /**
   * The lines standing at this stop, in walking order. The rail needs them to
   * be tappable: a shopper who is already looking at the shelf should be able
   * to take the thing they can see, not the thing the route says is next.
   */
  items: RouteStopItem[];
};

export type RouteStopItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  status: TripItem["status"];
  /** True for the line a swap put here, which nobody wrote down. */
  replacement: boolean;
};

/**
 * The walk, as a list of stops.
 *
 * Trip mode shows one item, which is the right amount to act on and the wrong
 * amount to feel oriented by — you cannot tell whether you are near the end of
 * the dairy aisle or the end of the shop. The stops give that back without
 * putting the whole list on screen again.
 */
export function routeStops(
  items: TripItem[],
  currentItemId: string | null,
  ctx: WalkContext,
): RouteStop[] {
  const groups = groupByAisle(items, ctx);
  const stops: RouteStop[] = [];
  let currentSeen = false;

  for (const group of groups) {
    // A replacement stands in for a line the shopper already wrote, so counting
    // it again would make the aisle look longer than it is.
    const written = group.items.filter((i) => !i.substitutedForId);
    const done = written.filter(
      (i) => i.status !== "pending" && i.status !== "not_here",
    ).length;
    const holdsCurrent = group.items.some((i) => i.id === currentItemId);

    let status: RouteStop["status"];
    if (holdsCurrent) {
      status = "current";
      currentSeen = true;
    } else {
      status = currentSeen ? "ahead" : "done";
    }

    stops.push({
      key: group.key,
      aisle: group.aisle,
      section: group.section,
      order: group.order,
      total: written.length,
      done,
      status,
      items: group.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name:
          ctx.catalogue.find((p) => p.id === item.productId)?.name ??
          item.productId,
        quantity: item.quantity,
        status: item.status,
        replacement: item.substitutedForId !== undefined,
      })),
    });
  }

  // No current item means the trip is over, so nothing is still ahead.
  if (!currentSeen) {
    return stops.map((stop) => ({ ...stop, status: "done" }));
  }

  return stops;
}
