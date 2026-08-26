import { describe, expect, it } from "vitest";
import { squarify } from "./treemap";
import type { TreemapInput, TreemapTile } from "./treemap";

const W = 400;
const H = 300;

const input = (weights: number[]): TreemapInput[] =>
  weights.map((weight, i) => ({ key: `k${i}`, weight }));

function overlaps(a: TreemapTile, b: TreemapTile): boolean {
  const gap = 1e-6;
  return (
    a.x < b.x + b.width - gap &&
    b.x < a.x + a.width - gap &&
    a.y < b.y + b.height - gap &&
    b.y < a.y + a.height - gap
  );
}

describe("squarify", () => {
  it("gives every item a tile", () => {
    const tiles = squarify(input([5, 3, 2, 1, 1]), W, H);
    expect(tiles.map((t) => t.key).sort()).toEqual(["k0", "k1", "k2", "k3", "k4"]);
  });

  it("fills the rectangle exactly, with nothing left over", () => {
    const tiles = squarify(input([5, 3, 2, 1, 1]), W, H);
    const covered = tiles.reduce((sum, t) => sum + t.width * t.height, 0);
    expect(covered).toBeCloseTo(W * H, 4);
  });

  it("never overlaps two tiles", () => {
    const tiles = squarify(input([8, 5, 4, 3, 2, 2, 1]), W, H);
    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        expect(overlaps(tiles[i], tiles[j])).toBe(false);
      }
    }
  });

  it("keeps every tile inside the rectangle", () => {
    const tiles = squarify(input([8, 5, 4, 3, 2, 2, 1]), W, H);
    for (const t of tiles) {
      expect(t.x).toBeGreaterThanOrEqual(-1e-6);
      expect(t.y).toBeGreaterThanOrEqual(-1e-6);
      expect(t.x + t.width).toBeLessThanOrEqual(W + 1e-6);
      expect(t.y + t.height).toBeLessThanOrEqual(H + 1e-6);
    }
  });

  it("makes area proportional to weight", () => {
    const tiles = squarify(input([6, 3, 1]), W, H);
    const area = (key: string) => {
      const t = tiles.find((x) => x.key === key)!;
      return t.width * t.height;
    };
    expect(area("k0") / area("k1")).toBeCloseTo(2, 3);
    expect(area("k1") / area("k2")).toBeCloseTo(3, 3);
  });

  it("preserves walking order — it does not sort by size", () => {
    // The published algorithm sorts descending. Sweep must not: aisle order is
    // the product. A small aisle 2 still comes before a big aisle 11.
    const tiles = squarify(input([1, 9, 1, 9]), W, H);
    expect(tiles.map((t) => t.key)).toEqual(["k0", "k1", "k2", "k3"]);
  });

  it("handles a single item by handing it the whole rectangle", () => {
    const [tile] = squarify(input([3]), W, H);
    expect(tile).toMatchObject({ x: 0, y: 0, width: W, height: H });
  });

  it("returns nothing for an empty list or an empty rectangle", () => {
    expect(squarify([], W, H)).toEqual([]);
    expect(squarify(input([1, 2]), 0, H)).toEqual([]);
    expect(squarify(input([1, 2]), W, 0)).toEqual([]);
  });

  it("shares the space equally when every weight is zero", () => {
    const tiles = squarify(input([0, 0, 0, 0]), W, H);
    expect(tiles).toHaveLength(4);
    const covered = tiles.reduce((sum, t) => sum + t.width * t.height, 0);
    expect(covered).toBeCloseTo(W * H, 4);
    const first = tiles[0].width * tiles[0].height;
    for (const t of tiles) expect(t.width * t.height).toBeCloseTo(first, 4);
  });

  it("still tiles when one item carries all the weight", () => {
    const tiles = squarify(input([10, 0, 0]), W, H);
    expect(tiles).toHaveLength(3);
    const covered = tiles.reduce((sum, t) => sum + t.width * t.height, 0);
    expect(covered).toBeCloseTo(W * H, 4);
  });

  it("treats a negative weight as nothing rather than inverting the layout", () => {
    const tiles = squarify(input([4, -4, 4]), W, H);
    expect(tiles).toHaveLength(3);
    const covered = tiles.reduce((sum, t) => sum + t.width * t.height, 0);
    expect(covered).toBeCloseTo(W * H, 4);
  });

  it("copes with a long list without dropping or duplicating a tile", () => {
    const many = input(Array.from({ length: 40 }, (_, i) => (i % 7) + 1));
    const tiles = squarify(many, W, H);
    expect(tiles).toHaveLength(40);
    expect(new Set(tiles.map((t) => t.key)).size).toBe(40);
    const covered = tiles.reduce((sum, t) => sum + t.width * t.height, 0);
    expect(covered).toBeCloseTo(W * H, 3);
  });
});
