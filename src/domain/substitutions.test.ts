import { describe, expect, it } from "vitest";
import { rank, requiredTags, substitutesFor } from "./substitutions";
import type { Ctx } from "./substitutions";
import type { Product, UserProductPreference } from "./types";

const product = (over: Partial<Product> & { id: string }): Product => ({
  name: over.id,
  brand: "Tesco",
  ownBrand: true,
  size: "500g",
  category: "bakery",
  dietaryTags: [],
  price: 100,
  ...over,
});

const ctx = (over: Partial<Ctx> = {}): Ctx => ({
  catalogue: [],
  prefs: {},
  purchases: [],
  priorSubstitutions: [],
  ...over,
});

const locked = (productId: string): Record<string, UserProductPreference> => ({
  [productId]: {
    productId,
    neverSubstitute: true,
    note: "Mum's coeliac, so a close match isn't good enough.",
  },
});

describe("the safety filter", () => {
  // This runs first because it must hold before ranking is reachable at all.
  it("returns nothing for a protected product, even when a perfect match exists", () => {
    const target = product({ id: "gf-white", dietaryTags: ["gluten-free"] });
    const twin = product({ id: "gf-brown", dietaryTags: ["gluten-free"] });

    const result = substitutesFor(
      target,
      ctx({ catalogue: [target, twin], prefs: locked("gf-white") }),
    );

    expect(result).toEqual([]);
  });

  it("is a gate, not a penalty: the protected product never reaches ranking", () => {
    const target = product({ id: "gf-white", dietaryTags: ["gluten-free"] });
    const twin = product({ id: "gf-brown", dietaryTags: ["gluten-free"] });
    const c = ctx({ catalogue: [target, twin], prefs: locked("gf-white") });

    // Ranking the same pool directly does produce a result, so the empty
    // return above is the gate and not an accident of scoring.
    expect(rank([twin], target, c)).toHaveLength(1);
    expect(substitutesFor(target, c)).toHaveLength(0);
  });

  it("drops candidates that lose a dietary tag the target carries", () => {
    const target = product({ id: "gf-white", dietaryTags: ["gluten-free"] });
    const wheat = product({ id: "white-loaf", dietaryTags: [] });
    const gf = product({ id: "gf-brown", dietaryTags: ["gluten-free"] });

    const ids = substitutesFor(
      target,
      ctx({ catalogue: [target, wheat, gf] }),
    ).map((r) => r.product.id);

    expect(ids).toEqual(["gf-brown"]);
  });

  it("treats taste tags as preferences, not gates", () => {
    const target = product({ id: "organic-loaf", dietaryTags: ["organic"] });
    const plain = product({ id: "plain-loaf", dietaryTags: [] });

    expect(requiredTags(target)).toEqual([]);
    expect(
      substitutesFor(target, ctx({ catalogue: [target, plain] })),
    ).toHaveLength(1);
  });

  it("never crosses a category", () => {
    const target = product({ id: "loaf", category: "bakery" });
    const milk = product({ id: "milk", category: "dairy" });

    expect(substitutesFor(target, ctx({ catalogue: [target, milk] }))).toEqual(
      [],
    );
  });
});

describe("ranking", () => {
  const semi2l = product({
    id: "semi-2l",
    category: "dairy",
    size: "2L",
    unitMl: 2000,
    lineId: "semi",
    price: 145,
    attributes: { fat: "semi-skimmed" },
  });
  const semi1l = product({
    id: "semi-1l",
    category: "dairy",
    size: "1L",
    unitMl: 1000,
    lineId: "semi",
    price: 90,
    attributes: { fat: "semi-skimmed" },
  });
  const whole2l = product({
    id: "whole-2l",
    category: "dairy",
    size: "2L",
    unitMl: 2000,
    lineId: "whole",
    price: 145,
    attributes: { fat: "whole" },
  });
  const arla = product({
    id: "arla-2l",
    category: "dairy",
    size: "2L",
    unitMl: 2000,
    brand: "Arla",
    ownBrand: false,
    price: 165,
    attributes: { fat: "semi-skimmed" },
  });

  const catalogue = [semi2l, semi1l, whole2l, arla];

  it("puts the same product line in a different size first", () => {
    const result = substitutesFor(semi2l, ctx({ catalogue }));
    expect(result[0].product.id).toBe("semi-1l");
    expect(result[0].reason).toBe("Same product, smaller size. Buy 2.");
  });

  it("marks exactly one result as recommended", () => {
    const result = substitutesFor(semi2l, ctx({ catalogue }));
    expect(result.filter((r) => r.recommended)).toHaveLength(1);
    expect(result[0].recommended).toBe(true);
  });

  it("gives every result a reason", () => {
    const result = substitutesFor(semi2l, ctx({ catalogue }));
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) expect(r.reason).toMatch(/\S/);
  });

  it("returns at most three", () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      product({ id: `milk-${i}`, category: "dairy", price: 140 + i }),
    );
    expect(
      substitutesFor(semi2l, ctx({ catalogue: [semi2l, ...many] })),
    ).toHaveLength(3);
  });

  it("names the month of a previous swap", () => {
    const result = substitutesFor(
      semi2l,
      ctx({
        catalogue: [semi2l, arla],
        priorSubstitutions: [
          {
            targetProductId: "semi-2l",
            replacementProductId: "arla-2l",
            date: "2026-03-14",
          },
        ],
      }),
    );
    expect(result[0].reason).toBe("You swapped to this in March.");
  });

  it("names the differing attribute when the size matches", () => {
    const result = substitutesFor(whole2l, ctx({ catalogue: [whole2l, arla] }));
    expect(result[0].reason).toBe("Same size, different fat content.");
  });

  it("penalises distance in price", () => {
    const near = product({ id: "near", category: "dairy", price: 150 });
    const far = product({ id: "far", category: "dairy", price: 900 });
    const result = substitutesFor(
      semi2l,
      ctx({ catalogue: [semi2l, near, far] }),
    );
    expect(result[0].product.id).toBe("near");
  });
});

describe("the group gate", () => {
  const chop = product({
    id: "pork-chop",
    category: "fresh",
    group: "pork",
    price: 420,
  });
  const bacon = product({
    id: "bacon",
    category: "fresh",
    group: "pork",
    price: 320,
  });
  const lemon = product({
    id: "lemon",
    category: "fresh",
    group: "fruit",
    price: 95,
  });

  it("never crosses a group, even inside one category", () => {
    // "fresh" holds fruit, veg, meat and fish. Category alone would offer a
    // lemon in place of a pork chop, which is the whole reason group exists.
    const ids = substitutesFor(
      chop,
      ctx({ catalogue: [chop, bacon, lemon] }),
    ).map((r) => r.product.id);

    expect(ids).toEqual(["bacon"]);
  });

  it("falls back to category when a product has no group", () => {
    const loose = product({ id: "loose", category: "fresh" });
    const other = product({ id: "other", category: "fresh" });
    expect(
      substitutesFor(loose, ctx({ catalogue: [loose, other] })),
    ).toHaveLength(1);
  });
});

describe("dietary tags that imply other tags", () => {
  it("accepts a vegan stand-in for a vegetarian product", () => {
    // Vegan is the stricter claim. Comparing the strings literally would throw
    // the better product away.
    const target = product({ id: "crisps", dietaryTags: ["vegetarian"] });
    const swap = product({ id: "pretzels", dietaryTags: ["vegan"] });

    expect(
      substitutesFor(target, ctx({ catalogue: [target, swap] })),
    ).toHaveLength(1);
  });

  it("does not accept a vegetarian stand-in for a vegan product", () => {
    const target = product({ id: "oat-drink", dietaryTags: ["vegan"] });
    const swap = product({ id: "milk", dietaryTags: ["vegetarian"] });

    expect(substitutesFor(target, ctx({ catalogue: [target, swap] }))).toEqual(
      [],
    );
  });

  it("still refuses to drop gluten-free", () => {
    const target = product({ id: "gf", dietaryTags: ["gluten-free", "vegan"] });
    const swap = product({ id: "wheat", dietaryTags: ["vegan"] });

    expect(substitutesFor(target, ctx({ catalogue: [target, swap] }))).toEqual(
      [],
    );
  });
});
