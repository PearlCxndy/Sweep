import { describe, expect, it } from "vitest";
import { routeStops } from "./route";
import type { Product, Store, StorePlacement, TripItem } from "./types";

const store: Store = {
  id: "s1",
  retailer: "tesco",
  branch: "Extra Walthamstow",
  placeId: null,
  lat: null,
  lng: null,
  hasLayout: true,
};

function prod(id: string, category: Product["category"]): Product {
  return {
    id,
    name: id,
    brand: "Tesco",
    ownBrand: true,
    size: "1",
    category,
    dietaryTags: [],
    price: 100,
  };
}

const catalogue = [
  prod("milk", "dairy"),
  prod("butter", "dairy"),
  prod("bread", "bakery"),
  prod("beans", "cupboard"),
];

const placements: StorePlacement[] = [
  { storeId: "s1", productId: "milk", aisle: 4, section: "Dairy", aisleOrder: 1 },
  { storeId: "s1", productId: "butter", aisle: 4, section: "Dairy", aisleOrder: 1 },
  { storeId: "s1", productId: "bread", aisle: 6, section: "Bakery", aisleOrder: 2 },
  { storeId: "s1", productId: "beans", aisle: 9, section: "Tins", aisleOrder: 3 },
];

const ctx = { store, placements, catalogue };

const item = (
  id: string,
  productId: string,
  status: TripItem["status"] = "pending",
  substitutedForId?: string,
): TripItem => ({ id, productId, quantity: 1, status, substitutedForId });

describe("routeStops", () => {
  it("gives one stop per aisle, in walking order", () => {
    const stops = routeStops(
      [item("a", "milk"), item("b", "butter"), item("c", "bread"), item("d", "beans")],
      "a",
      ctx,
    );
    expect(stops.map((s) => s.aisle)).toEqual([4, 6, 9]);
    expect(stops[0].total).toBe(2);
  });

  it("marks what is behind, where you are, and what is ahead", () => {
    const stops = routeStops(
      [
        item("a", "milk", "in_trolley"),
        item("b", "butter", "in_trolley"),
        item("c", "bread"),
        item("d", "beans"),
      ],
      "c",
      ctx,
    );
    expect(stops.map((s) => s.status)).toEqual(["done", "current", "ahead"]);
  });

  it("counts a settled item however it was settled", () => {
    const stops = routeStops(
      [
        item("a", "milk", "in_trolley"),
        item("b", "butter", "skipped"),
        item("c", "bread"),
      ],
      "c",
      ctx,
    );
    expect(stops[0]).toMatchObject({ total: 2, done: 2 });
  });

  it("does not count an item still waiting to be resolved", () => {
    const stops = routeStops(
      [item("a", "milk", "not_here"), item("b", "butter"), item("c", "bread")],
      "a",
      ctx,
    );
    expect(stops[0]).toMatchObject({ total: 2, done: 0 });
  });

  it("does not let a replacement inflate the aisle", () => {
    // The shopper wrote one line; swapping it does not make the aisle longer.
    const stops = routeStops(
      [
        item("a", "milk", "substituted"),
        item("r", "butter", "in_trolley", "milk"),
        item("c", "bread"),
      ],
      "c",
      ctx,
    );
    expect(stops[0]).toMatchObject({ total: 1, done: 1 });
  });

  it("carries the lines standing at each stop, so the rail can offer them", () => {
    const stops = routeStops(
      [item("a", "milk"), item("b", "butter", "in_trolley"), item("c", "bread")],
      "a",
      ctx,
    );
    expect(stops[0].items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(stops[0].items[1]).toMatchObject({
      name: "butter",
      status: "in_trolley",
      replacement: false,
    });
    expect(stops[1].items).toHaveLength(1);
  });

  it("marks a replacement line as one nobody wrote down", () => {
    const stops = routeStops(
      [item("a", "milk", "substituted"), item("r", "butter", "in_trolley", "milk")],
      null,
      ctx,
    );
    expect(stops[0].items.map((i) => i.replacement)).toEqual([false, true]);
  });

  it("treats the whole walk as done once there is no current item", () => {
    const stops = routeStops(
      [item("a", "milk", "in_trolley"), item("c", "bread", "in_trolley")],
      null,
      ctx,
    );
    expect(stops.every((s) => s.status === "done")).toBe(true);
  });

  it("falls back to sections when the branch has no layout", () => {
    const stops = routeStops(
      [item("a", "milk"), item("c", "bread")],
      "a",
      { ...ctx, store: { ...store, hasLayout: false } },
    );
    expect(stops.every((s) => s.aisle === null)).toBe(true);
    expect(stops.map((s) => s.section)).toEqual(["Bakery", "Dairy"]);
  });
});
