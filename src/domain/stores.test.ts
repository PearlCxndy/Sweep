import { describe, expect, it } from "vitest";
import { outwardCode, normaliseUkPostcode } from "./postcode";
import {
  cleanBranchName,
  hasSeededLayout,
  mergeSeededPlaces,
  searchSeededPlaces,
  seededPlaceFor,
} from "./stores";

describe("cleanBranchName", () => {
  it("drops the retailer name we already know", () => {
    expect(cleanBranchName("Tesco Express 262 Poplar High St", "tesco")).toBe(
      "Express 262 Poplar High St",
    );
  });

  it("handles a retailer whose Places name differs from its display name", () => {
    // Places returns "Co-op Food"; the display name is the same, but the
    // branch prefix in the wild is just "Co-op".
    expect(cleanBranchName("Co-op Food Hoe Street", "coop")).toBe(
      "Food Hoe Street",
    );
  });

  it("copes with an apostrophe in the retailer name", () => {
    expect(cleanBranchName("Sainsbury's Local Bakers Arms", "sainsburys")).toBe(
      "Local Bakers Arms",
    );
  });

  it("leaves a name alone when it does not start with the retailer", () => {
    expect(cleanBranchName("Poplar Superstore", "tesco")).toBe(
      "Poplar Superstore",
    );
  });

  it("leaves 'other' alone, because there is no prefix to strip", () => {
    expect(cleanBranchName("Turkish supermarket", "other")).toBe(
      "Turkish supermarket",
    );
  });

  it("trims", () => {
    expect(cleanBranchName("  Aldi  High Street  ", "aldi")).toBe("High Street");
  });
});

describe("hasSeededLayout", () => {
  it("knows the one branch we actually hold a layout for", () => {
    expect(hasSeededLayout("tesco", "Express 262 Poplar High St")).toBe(true);
  });

  it("does not claim a layout for another Tesco", () => {
    expect(hasSeededLayout("tesco", "Metro Liverpool Street")).toBe(false);
  });

  it("does not claim a layout for another retailer in the same place", () => {
    expect(hasSeededLayout("aldi", "Poplar High St")).toBe(false);
  });
});

describe("postcode", () => {
  it("puts the space back in a mashed UK postcode", () => {
    expect(normaliseUkPostcode("E140Tb")).toBe("E14 0TB");
    expect(normaliseUkPostcode("e14 0tb")).toBe("E14 0TB");
  });

  it("reads the outward code from either form", () => {
    expect(outwardCode("E140TB")).toBe("E14");
    expect(outwardCode("E14 0TB")).toBe("E14");
  });
});

describe("searchSeededPlaces", () => {
  it("returns the Poplar Tesco for an E14 postcode, mashed or not", () => {
    const found = searchSeededPlaces("tesco", "E140Tb");
    expect(found).toHaveLength(1);
    expect(found[0]?.name).toMatch(/Poplar High St/i);
  });

  it("does not invent a Tesco for a postcode we do not know", () => {
    expect(searchSeededPlaces("tesco", "SW1A 1AA")).toEqual([]);
  });

  it("does not return Tesco when the shopper picked another chain", () => {
    expect(searchSeededPlaces("aldi", "E14 0TB")).toEqual([]);
  });

  it("puts the seeded shop in front of live results", () => {
    const merged = mergeSeededPlaces("tesco", "E14 0TB", [
      {
        placeId: "live",
        name: "Tesco Superstore",
        address: "Nearby",
        lat: 51.5,
        lng: -0.02,
      },
    ]);
    expect(merged[0]?.name).toMatch(/Poplar High St/i);
    expect(merged).toHaveLength(2);
  });

  it("exposes the Poplar Tesco as the seeded place for Tesco", () => {
    expect(seededPlaceFor("tesco")?.name).toBe(
      "Tesco Express 262 Poplar High St",
    );
    expect(seededPlaceFor("aldi")).toBeUndefined();
  });
});
