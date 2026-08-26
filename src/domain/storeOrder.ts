import { FALLBACK_SECTION_ORDER } from "./types";
import type { Product, Store, StorePlacement, TripItem } from "./types";

export type OrderedGroup = {
  key: string;
  aisle: number | null;
  section: string;
  /** This stop's place in the store's own order — what `startFrom` takes. */
  order: number;
  items: TripItem[];
};

/**
 * Everything the walking order depends on.
 *
 * `startAisleOrder` rotates it. See `orderTripItems`.
 */
export type WalkContext = {
  store: Store;
  placements: StorePlacement[];
  catalogue: Product[];
  startAisleOrder?: number;
};

/**
 * Sort trip items by the walking order of the store.
 * If the layout is unknown we fall back to a fixed category order —
 * degraded, not broken.
 *
 * `ctx.startAisleOrder` rotates that order rather than reshuffling it. A
 * shopper standing in aisle 6 walks 6, 9, 11 and then comes back round for the
 * 4 they passed — so the aisles behind them keep their order and simply go to
 * the end. Nothing is reordered relative to anything else in its half, which
 * is what makes the rotation reversible: clear the field and the original walk
 * is back, with no record of the detour to unpick.
 */
export function orderTripItems(
  items: TripItem[],
  ctx: WalkContext,
): TripItem[] {
  const start = ctx.startAisleOrder;

  return [...items].sort((a, b) => {
    const wa = walkIndex(a, ctx);
    const wb = walkIndex(b, ctx);

    // 0 = still ahead of the shopper, 1 = behind them and coming round again.
    const lapA = start === undefined || wa >= start ? 0 : 1;
    const lapB = start === undefined || wb >= start ? 0 : 1;
    if (lapA !== lapB) return lapA - lapB;

    if (wa !== wb) return wa - wb;
    return a.id.localeCompare(b.id);
  });
}

export function walkIndex(item: TripItem, ctx: WalkContext): number {
  if (ctx.store.hasLayout) {
    const placement = placementFor(item.productId, ctx);
    if (placement) return placement.aisleOrder;
  }
  const product = ctx.catalogue.find((p) => p.id === item.productId);
  if (!product) return Number.MAX_SAFE_INTEGER;
  const idx = FALLBACK_SECTION_ORDER.indexOf(product.category);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

export function placementFor(
  productId: string,
  ctx: { store: Store; placements: StorePlacement[] },
): StorePlacement | undefined {
  return ctx.placements.find(
    (p) => p.storeId === ctx.store.id && p.productId === productId,
  );
}

/** Trip items collapsed into the groups the shopper actually walks. */
export function groupByAisle(
  items: TripItem[],
  ctx: WalkContext,
): OrderedGroup[] {
  const ordered = orderTripItems(items, ctx);
  const groups: OrderedGroup[] = [];

  for (const item of ordered) {
    const placement = ctx.store.hasLayout
      ? placementFor(item.productId, ctx)
      : undefined;
    const product = ctx.catalogue.find((p) => p.id === item.productId);
    const section = placement?.section ?? sectionWord(product?.category);
    const aisle = placement?.aisle ?? null;
    const key = `${aisle ?? "x"}-${section}`;

    const last = groups.at(-1);
    if (last && last.key === key) last.items.push(item);
    else
      groups.push({
        key,
        aisle,
        section,
        order: walkIndex(item, ctx),
        items: [item],
      });
  }

  return groups;
}

function sectionWord(category?: string): string {
  if (!category) return "Elsewhere";
  return category.charAt(0).toUpperCase() + category.slice(1);
}
