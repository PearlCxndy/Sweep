export type TreemapInput = {
  key: string;
  /** Relative area. Zero-weight entries still get a tile. */
  weight: number;
};

/** Fractions of the container, 0..1, so the caller can position in percent. */
export type TreemapTile = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Squarified treemap, with one deliberate change: it does not sort.
 *
 * The published algorithm sorts descending, which gives the best aspect ratios.
 * Sweep cannot do that. The list is in walking order — that is the entire point
 * of the product — and reordering aisles by how many items they hold would put
 * aisle 12 before aisle 2 and send the shopper back on themselves.
 *
 * So input order is preserved and the aspect ratios come out slightly worse.
 * That is the right trade here: a tidier rectangle is not worth a wrong route.
 */
export function squarify(
  items: TreemapInput[],
  width: number,
  height: number,
): TreemapTile[] {
  if (items.length === 0 || width <= 0 || height <= 0) return [];

  const areas = areasFor(items, width * height);

  const out: TreemapTile[] = [];
  let rect: Rect = { x: 0, y: 0, w: width, h: height };
  let row: number[] = [];
  let i = 0;

  while (i < items.length) {
    const short = Math.min(rect.w, rect.h);
    const withNext = [...row, i];

    if (row.length === 0 || worst(withNext, areas, short) <= worst(row, areas, short)) {
      row = withNext;
      i++;
      continue;
    }

    rect = layoutRow(row, areas, items, rect, out);
    row = [];
  }

  if (row.length > 0) layoutRow(row, areas, items, rect, out);

  return out;
}

/**
 * Every tile gets a positive area, including a weightless one.
 *
 * A zero-area tile is not just invisible, it breaks the layout: a row of them
 * has no thickness, so it swallows the whole remaining rectangle and the next
 * tile divides by a zero-height strip. Weightless entries get a small fixed
 * share instead, taken off the top before the rest is shared out — which keeps
 * the ordinary all-positive case exactly proportional.
 */
function areasFor(items: TreemapInput[], area: number): number[] {
  const positive = items.filter((item) => item.weight > 0);

  // Nothing to weigh by: share the space equally rather than collapsing.
  if (positive.length === 0) return items.map(() => area / items.length);

  const sliver = 1 / (items.length * 8);
  const reserved = area * sliver * (items.length - positive.length);
  const totalWeight = positive.reduce((sum, item) => sum + item.weight, 0);

  return items.map((item) =>
    item.weight > 0
      ? (item.weight / totalWeight) * (area - reserved)
      : area * sliver,
  );
}

/** The worst aspect ratio in a row, which is what squarifying minimises. */
function worst(row: number[], areas: number[], short: number): number {
  if (row.length === 0 || short <= 0) return Number.POSITIVE_INFINITY;

  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const index of row) {
    const area = areas[index];
    sum += area;
    if (area < min) min = area;
    if (area > max) max = area;
  }
  if (sum <= 0 || min <= 0) return Number.POSITIVE_INFINITY;

  const s2 = sum * sum;
  const w2 = short * short;
  return Math.max((w2 * max) / s2, s2 / (w2 * min));
}

/** Lay the row along the shorter side and return what is left of the rect. */
function layoutRow(
  row: number[],
  areas: number[],
  items: TreemapInput[],
  rect: Rect,
  out: TreemapTile[],
): Rect {
  const sum = row.reduce((acc, index) => acc + areas[index], 0);
  const horizontal = rect.w >= rect.h;

  if (horizontal) {
    // A vertical strip down the left of what remains.
    const stripWidth = sum / rect.h;
    let y = rect.y;
    for (const [n, index] of row.entries()) {
      const isLast = n === row.length - 1;
      const h = isLast ? rect.y + rect.h - y : areas[index] / stripWidth;
      out.push({
        key: items[index].key,
        x: rect.x,
        y,
        width: stripWidth,
        height: h,
      });
      y += h;
    }
    return { x: rect.x + stripWidth, y: rect.y, w: rect.w - stripWidth, h: rect.h };
  }

  // A horizontal strip across the top of what remains.
  const stripHeight = sum / rect.w;
  let x = rect.x;
  for (const [n, index] of row.entries()) {
    const isLast = n === row.length - 1;
    const w = isLast ? rect.x + rect.w - x : areas[index] / stripHeight;
    out.push({
      key: items[index].key,
      x,
      y: rect.y,
      width: w,
      height: stripHeight,
    });
    x += w;
  }
  return { x: rect.x, y: rect.y + stripHeight, w: rect.w, h: rect.h - stripHeight };
}
