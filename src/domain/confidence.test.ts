import { describe, expect, it } from "vitest";
import { confidenceOf, intervalsOf, median, stdev } from "./confidence";
import type { Purchase } from "./types";

const TODAY = new Date("2026-08-23T00:00:00Z");

let n = 0;
const on = (date: string): Purchase => ({
  id: `p${n++}`,
  productId: "milk",
  storeId: "s1",
  tripId: "t1",
  date,
});

function every(gapDays: number, count: number, endedAgo = 0): Purchase[] {
  const end = Date.parse("2026-08-23T00:00:00Z") - endedAgo * 86_400_000;
  return Array.from({ length: count }, (_, i) =>
    on(
      new Date(end - (count - 1 - i) * gapDays * 86_400_000)
        .toISOString()
        .slice(0, 10),
    ),
  );
}

describe("median and stdev", () => {
  it("takes the middle of an odd list", () => {
    expect(median([9, 1, 5])).toBe(5);
  });
  it("averages the middle pair of an even list", () => {
    expect(median([1, 2, 3, 10])).toBe(2.5);
  });
  it("is zero for an empty list", () => {
    expect(median([])).toBe(0);
    expect(stdev([])).toBe(0);
  });
  it("is zero when every value is the same", () => {
    expect(stdev([7, 7, 7])).toBe(0);
  });
});

describe("intervalsOf", () => {
  it("returns the day gaps between purchases, in order", () => {
    expect(
      intervalsOf([on("2026-08-01"), on("2026-08-08"), on("2026-08-10")]),
    ).toEqual([7, 2]);
  });
  it("sorts before measuring, so input order does not matter", () => {
    expect(
      intervalsOf([on("2026-08-10"), on("2026-08-01"), on("2026-08-08")]),
    ).toEqual([7, 2]);
  });
  it("has no intervals to report from a single purchase", () => {
    expect(intervalsOf([on("2026-08-01")])).toEqual([]);
  });
});

describe("confidenceOf", () => {
  it("is low when there is nothing to go on", () => {
    expect(confidenceOf([], TODAY)).toBe("low");
    expect(confidenceOf([on("2026-08-01")], TODAY)).toBe("low");
  });

  it("is high for a long, regular, recent run", () => {
    expect(confidenceOf(every(7, 12), TODAY)).toBe("high");
  });

  it("drops to medium when the run is short, however regular", () => {
    expect(confidenceOf(every(7, 5), TODAY)).toBe("medium");
  });

  it("drops to medium when a long run went quiet", () => {
    // Twelve regular purchases, but the last was three cycles ago.
    expect(confidenceOf(every(7, 12, 21), TODAY)).toBe("medium");
  });

  it("is low when the gaps are all over the place", () => {
    const erratic = [
      on("2026-03-01"),
      on("2026-03-03"),
      on("2026-05-20"),
      on("2026-05-22"),
      on("2026-08-20"),
    ];
    expect(confidenceOf(erratic, TODAY)).toBe("low");
  });
});
