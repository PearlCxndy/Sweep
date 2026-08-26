import { describe, expect, it } from "vitest";
import { basket } from "./basket";
import type { Product, TripItem } from "./types";

function prod(id: string, price: number): Product {
  return {
    id,
    name: id,
    brand: "Tesco",
    ownBrand: true,
    size: "1",
    category: "cupboard",
    dietaryTags: [],
    price,
  };
}

const catalogue = [prod("milk", 145), prod("bread", 110), prod("oats", 200)];

const item = (
  productId: string,
  status: TripItem["status"] = "pending",
  quantity = 1,
  substitutedForId?: string,
): TripItem => ({ id: `i-${productId}`, productId, quantity, status, substitutedForId });

describe("basket", () => {
  it("splits what is in the trolley from what is still to come", () => {
    expect(basket([item("milk", "in_trolley"), item("bread")], catalogue)).toEqual(
      { inTrolley: 145, remaining: 110, unpriced: 0 },
    );
  });

  it("multiplies by quantity", () => {
    expect(basket([item("milk", "in_trolley", 3)], catalogue).inTrolley).toBe(435);
  });

  it("counts a swap once, at the price of the thing picked up", () => {
    const total = basket(
      [
        { ...item("milk", "substituted"), id: "a" },
        { ...item("oats", "in_trolley", 1, "milk"), id: "r" },
      ],
      catalogue,
    );
    expect(total).toEqual({ inTrolley: 200, remaining: 0, unpriced: 0 });
  });

  it("still owes for a line waiting on a swap", () => {
    expect(basket([item("milk", "not_here")], catalogue).remaining).toBe(145);
  });

  it("is owed nothing for a line walked past", () => {
    expect(basket([item("milk", "skipped")], catalogue)).toEqual({
      inTrolley: 0,
      remaining: 0,
      unpriced: 0,
    });
  });

  it("counts what it has no price for instead of dropping it", () => {
    const total = basket([item("ghost", "in_trolley"), item("milk")], catalogue);
    expect(total).toEqual({ inTrolley: 0, remaining: 145, unpriced: 1 });
  });
});
