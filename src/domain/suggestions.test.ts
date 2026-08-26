import { describe, expect, it } from "vitest";
import {
  RETIRE_AFTER_DISMISSALS,
  excludedByDeletedInferences,
  retiredByDismissals,
  suggestItems,
} from "./suggestions";
import type { Inference, Purchase, Store } from "./types";

const store: Store = {
  id: "s1",
  retailer: "tesco",
  branch: "Express 262 Poplar High St",
  placeId: "place-1",
  lat: 51.5886,
  lng: -0.0198,
  hasLayout: true,
};
const other: Store = { ...store, id: "s2" };

let n = 0;
const buy = (productId: string, date: string, storeId = "s1"): Purchase => ({
  id: `p${n++}`,
  productId,
  storeId,
  tripId: `t-${date}`,
  date,
});

/** Purchases every `gap` days, ending `endedAgo` days before `today`. */
function series(
  productId: string,
  count: number,
  gap: number,
  endedAgo: number,
  today = "2026-08-23",
): Purchase[] {
  const end = Date.parse(`${today}T00:00:00Z`) - endedAgo * 86_400_000;
  return Array.from({ length: count }, (_, i) =>
    buy(
      productId,
      new Date(end - (count - 1 - i) * gap * 86_400_000)
        .toISOString()
        .slice(0, 10),
    ),
  );
}

const TODAY = new Date("2026-08-23T00:00:00Z");

describe("suggestItems", () => {
  it("needs at least two purchases before it will guess", () => {
    const one = suggestItems([buy("milk", "2026-08-01")], TODAY, { store });
    expect(one).toEqual([]);

    const two = suggestItems(series("milk", 2, 7, 7), TODAY, { store });
    expect(two.map((s) => s.productId)).toEqual(["milk"]);
  });

  it("suggests a day early, not a day late", () => {
    // Median 7, last bought 6 days ago: due tomorrow, so say so now.
    expect(suggestItems(series("milk", 4, 7, 6), TODAY, { store })).toHaveLength(1);
    // Five days ago is still too early.
    expect(suggestItems(series("milk", 4, 7, 5), TODAY, { store })).toHaveLength(0);
  });

  it("uses the median, so one stock-up does not move the interval", () => {
    const steady = [
      buy("rice", "2026-06-01"),
      buy("rice", "2026-06-08"),
      buy("rice", "2026-06-15"),
      buy("rice", "2026-06-22"),
      // A long gap over a holiday. The mean would jump; the median holds.
      buy("rice", "2026-08-16"),
    ];
    const [s] = suggestItems(steady, TODAY, { store });
    expect(s.medianInterval).toBe(7);
  });

  it("speaks in the product's voice", () => {
    const [s] = suggestItems(series("milk", 9, 5, 6), TODAY, { store });
    expect(s.reason).toBe("You buy this every 5 days. It's been 6.");
  });

  it("says the pattern is unclear rather than inventing one", () => {
    const [s] = suggestItems(series("houmous", 3, 6, 7), TODAY, { store });
    expect(s.confidence).toBe("low");
    expect(s.reason).toBe("Bought 3 times. Pattern still unclear.");
  });

  it("sorts by confidence first, then by how overdue", () => {
    const out = suggestItems(
      [
        // Weak evidence, badly overdue: still last, because confidence leads.
        ...series("weak", 3, 7, 30),
        ...series("barely-due", 10, 7, 8),
        ...series("well-overdue", 10, 7, 13),
      ],
      TODAY,
      { store },
    );
    expect(out.map((s) => s.productId)).toEqual([
      "well-overdue",
      "barely-due",
      "weak",
    ]);
    expect(out.map((s) => s.confidence)).toEqual(["high", "high", "low"]);
  });

  it("loses confidence in a run that has gone quiet, however long it was", () => {
    // Ten regular purchases, but the last was three cycles ago.
    const [s] = suggestItems(series("quiet", 10, 7, 22), TODAY, { store });
    expect(s.confidence).toBe("medium");
  });

  it("caps at five", () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      series(`p${i}`, 6, 7, 8 + i),
    ).flat();
    expect(suggestItems(many, TODAY, { store })).toHaveLength(5);
  });

  it("ignores purchases made at another shop", () => {
    const elsewhere = series("milk", 6, 7, 7).map((p) => ({ ...p, storeId: "s2" }));
    expect(suggestItems(elsewhere, TODAY, { store })).toEqual([]);
    expect(suggestItems(elsewhere, TODAY, { store: other })).toHaveLength(1);
  });

  it("says nothing about an item already on the list", () => {
    const purchases = series("milk", 6, 7, 8);
    expect(suggestItems(purchases, TODAY, { store })).toHaveLength(1);
    expect(
      suggestItems(purchases, TODAY, { store, exclude: ["milk"] }),
    ).toHaveLength(0);
  });
});

describe("excludedByDeletedInferences", () => {
  const inference = (
    id: string,
    basis: string[],
    deleted = false,
  ): Inference => ({
    id,
    claim: id,
    evidenceCount: 10,
    evidenceKind: "purchases",
    confidence: "high",
    deleted,
    basis,
  });

  it("takes the products a deleted claim rested on out of the inputs", () => {
    const inferences = [
      inference("milk", ["milk-2l", "milk-1l"]),
      inference("bread", ["loaf"]),
    ];
    expect(excludedByDeletedInferences(inferences, ["milk"])).toEqual([
      "milk-2l",
      "milk-1l",
    ]);
  });

  it("honours a claim that arrived already deleted", () => {
    expect(
      excludedByDeletedInferences([inference("milk", ["milk-2l"], true)], []),
    ).toEqual(["milk-2l"]);
  });

  it("leaves suggestions alone when nothing has been deleted", () => {
    expect(excludedByDeletedInferences([inference("milk", ["milk-2l"])], [])).toEqual(
      [],
    );
  });

  it("silences a product end to end", () => {
    const purchases = series("milk-2l", 8, 7, 8);
    const inferences = [inference("milk", ["milk-2l"])];

    expect(suggestItems(purchases, TODAY, { store })).toHaveLength(1);
    expect(
      suggestItems(purchases, TODAY, {
        store,
        exclude: excludedByDeletedInferences(inferences, ["milk"]),
      }),
    ).toHaveLength(0);
  });
});

describe("retiredByDismissals", () => {
  it("keeps offering something turned down once — that is 'not today'", () => {
    expect(retiredByDismissals({ houmous: 1 })).toEqual([]);
    expect(retiredByDismissals({ houmous: 2 })).toEqual([]);
  });

  it("retires it once the shopper has said no enough times to mean it", () => {
    expect(retiredByDismissals({ houmous: RETIRE_AFTER_DISMISSALS })).toEqual([
      "houmous",
    ]);
  });

  it("stops offering a retired product end to end", () => {
    const purchases = series("houmous", 8, 7, 8);
    expect(suggestItems(purchases, TODAY, { store })).toHaveLength(1);
    expect(
      suggestItems(purchases, TODAY, {
        store,
        exclude: retiredByDismissals({ houmous: RETIRE_AFTER_DISMISSALS }),
      }),
    ).toHaveLength(0);
  });
});
