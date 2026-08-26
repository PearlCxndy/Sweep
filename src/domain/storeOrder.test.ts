import { describe, expect, it } from "vitest";
import { groupByAisle, orderTripItems } from "./storeOrder";
import type { Product, Store, StorePlacement, TripItem } from "./types";

const known: Store = {
  id: "s1",
  retailer: "tesco",
  branch: "Express 262 Poplar High St",
  placeId: "place-1",
  lat: 51.5886,
  lng: -0.0198,
  hasLayout: true,
};
const unknown: Store = { ...known, id: "s2", hasLayout: false };

const catalogue: Product[] = [
  prod("milk", "dairy"),
  prod("bread", "bakery"),
  prod("bleach", "household"),
  prod("apples", "fresh"),
  prod("peas", "frozen"),
  prod("beans", "cupboard"),
];

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

// Deliberately not in category order: the shop is laid out how it is laid out.
const placements: StorePlacement[] = [
  { storeId: "s1", productId: "bleach", aisle: 2, section: "Household", aisleOrder: 1 },
  { storeId: "s1", productId: "milk", aisle: 4, section: "Dairy", aisleOrder: 2 },
  { storeId: "s1", productId: "apples", aisle: 6, section: "Fruit & veg", aisleOrder: 3 },
  { storeId: "s1", productId: "bread", aisle: 9, section: "Bakery", aisleOrder: 4 },
  { storeId: "s1", productId: "beans", aisle: 11, section: "Tins", aisleOrder: 5 },
  { storeId: "s1", productId: "peas", aisle: 14, section: "Frozen", aisleOrder: 6 },
];

const items: TripItem[] = ["peas", "milk", "bread", "beans", "bleach", "apples"].map(
  (productId) => ({ id: `ti-${productId}`, productId, quantity: 1, status: "pending" }),
);

describe("orderTripItems", () => {
  it("walks the store's own order when the layout is known", () => {
    const out = orderTripItems(items, { store: known, placements, catalogue });
    expect(out.map((i) => i.productId)).toEqual([
      "bleach",
      "milk",
      "apples",
      "bread",
      "beans",
      "peas",
    ]);
  });

  it("falls back to a fixed category order when the layout is not known", () => {
    const out = orderTripItems(items, { store: unknown, placements, catalogue });
    expect(out.map((i) => i.productId)).toEqual([
      "apples",
      "bread",
      "milk",
      "beans",
      "peas",
      "bleach",
    ]);
  });

  it("puts an item it cannot place at the end rather than dropping it", () => {
    const stray: TripItem = {
      id: "ti-stray",
      productId: "not-in-catalogue",
      quantity: 1,
      status: "pending",
    };
    const out = orderTripItems([stray, ...items], {
      store: known,
      placements,
      catalogue,
    });
    expect(out.at(-1)!.productId).toBe("not-in-catalogue");
    expect(out).toHaveLength(items.length + 1);
  });
});

describe("orderTripItems, rotated to start mid-shop", () => {
  const ctx = { store: known, placements, catalogue };

  it("starts at the given aisle and carries on in store order", () => {
    // Standing in aisle 6. Ahead: 6, 9, 11, 14. Behind, and coming round: 2, 4.
    const out = orderTripItems(items, { ...ctx, startAisleOrder: 3 });
    expect(out.map((i) => i.productId)).toEqual([
      "apples",
      "bread",
      "beans",
      "peas",
      "bleach",
      "milk",
    ]);
  });

  it("keeps the aisles behind the shopper in their own order", () => {
    const out = orderTripItems(items, { ...ctx, startAisleOrder: 5 });
    expect(out.map((i) => i.productId).slice(2)).toEqual([
      "bleach",
      "milk",
      "apples",
      "bread",
    ]);
  });

  it("is the plain walk again when the rotation is cleared", () => {
    const plain = orderTripItems(items, ctx);
    const put_back = orderTripItems(orderTripItems(items, { ...ctx, startAisleOrder: 4 }), ctx);
    expect(put_back.map((i) => i.productId)).toEqual(plain.map((i) => i.productId));
  });

  it("changes nothing when the walk already starts there", () => {
    const out = orderTripItems(items, { ...ctx, startAisleOrder: 1 });
    expect(out.map((i) => i.productId)).toEqual(
      orderTripItems(items, ctx).map((i) => i.productId),
    );
  });

  it("rotates a store with no layout by its section order", () => {
    // fresh, bakery, dairy, cupboard, frozen, household -> start at cupboard.
    const out = orderTripItems(items, {
      store: unknown,
      placements,
      catalogue,
      startAisleOrder: 3,
    });
    expect(out.map((i) => i.productId)).toEqual([
      "beans",
      "peas",
      "bleach",
      "apples",
      "bread",
      "milk",
    ]);
  });
});

describe("groupByAisle", () => {
  it("groups by aisle, in walking order", () => {
    const groups = groupByAisle(items, { store: known, placements, catalogue });
    expect(groups.map((g) => g.aisle)).toEqual([2, 4, 6, 9, 11, 14]);
    expect(groups.map((g) => g.section)).toEqual([
      "Household",
      "Dairy",
      "Fruit & veg",
      "Bakery",
      "Tins",
      "Frozen",
    ]);
  });

  it("keeps neighbours in the same aisle together", () => {
    const extra: StorePlacement = {
      storeId: "s1",
      productId: "butter",
      aisle: 4,
      section: "Dairy",
      aisleOrder: 2,
    };
    const groups = groupByAisle(
      [...items, { id: "ti-butter", productId: "butter", quantity: 1, status: "pending" }],
      {
        store: known,
        placements: [...placements, extra],
        catalogue: [...catalogue, prod("butter", "dairy")],
      },
    );
    const dairy = groups.find((g) => g.aisle === 4)!;
    expect(dairy.items.map((i) => i.productId).sort()).toEqual(["butter", "milk"]);
    expect(groups).toHaveLength(6);
  });

  it("names sections by category, with no aisle number, when the layout is unknown", () => {
    const groups = groupByAisle(items, { store: unknown, placements, catalogue });
    expect(groups.every((g) => g.aisle === null)).toBe(true);
    expect(groups.map((g) => g.section)).toEqual([
      "Fresh",
      "Bakery",
      "Dairy",
      "Cupboard",
      "Frozen",
      "Household",
    ]);
  });
});

describe("OrderedGroup.order", () => {
  it("carries the walk index that start-here takes", () => {
    const groups = groupByAisle(items, { store: known, placements, catalogue });
    expect(groups.map((g) => [g.aisle, g.order])).toEqual([
      [2, 1],
      [4, 2],
      [6, 3],
      [9, 4],
      [11, 5],
      [14, 6],
    ]);
  });

  it("round-trips: starting at a stop's order puts that stop first", () => {
    const ctx = { store: known, placements, catalogue };
    const target = groupByAisle(items, ctx)[3];
    const rotated = groupByAisle(items, { ...ctx, startAisleOrder: target.order });
    expect(rotated[0].aisle).toBe(target.aisle);
    expect(rotated).toHaveLength(6);
  });
});
