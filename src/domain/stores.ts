import { outwardCode } from "./postcode";
import { RETAILER_NAMES } from "./types";
import type { Retailer } from "./types";

export type NearbyPlace = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

/**
 * The one branch this prototype actually knows. Google is optional; this is
 * not. E14 (Poplar) is where the seeded Tesco lives, so a postcode search
 * there must still return a shop when Places is not configured.
 */
const SEEDED_NEARBY: (NearbyPlace & {
  retailer: Retailer;
  outwardCodes: string[];
})[] = [
  {
    retailer: "tesco",
    placeId: "seed:tesco-express-poplar-high-st",
    name: "Tesco Express 262 Poplar High St",
    address: "262 Poplar High St, London E14 0BB",
    lat: 51.5094,
    lng: -0.0165,
    outwardCodes: ["E14"],
  },
];

/** How each retailer prefixes its own branch names in Places results. */
const RETAILER_PREFIX: Record<Retailer, string> = {
  ...RETAILER_NAMES,
  coop: "Co-op",
  other: "",
};

/**
 * "Tesco Express 262 Poplar High St" -> "Express 262 Poplar High St".
 * The retailer is already known, so repeating it in the branch name is noise.
 */
export function cleanBranchName(name: string, retailer: Retailer): string {
  const trimmed = name.trim();
  const prefix = RETAILER_PREFIX[retailer];
  if (!prefix) return trimmed;
  return trimmed.toLowerCase().startsWith(prefix.toLowerCase())
    ? trimmed.slice(prefix.length).trim()
    : trimmed;
}

/**
 * Do we hold a placement table for this branch?
 *
 * We hold exactly one, and it is seeded: Tesco Express 262 Poplar High St.
 * Every other
 * branch falls back to section ordering, and the confirmation screen says so
 * before the shopper has invested anything.
 */
export function hasSeededLayout(retailer: Retailer, branch: string): boolean {
  return retailer === "tesco" && /poplar high st/i.test(branch);
}

export function seededPlaceFor(retailer: string): NearbyPlace | undefined {
  const row = SEEDED_NEARBY.find((place) => place.retailer === retailer);
  if (!row) return undefined;
  return {
    placeId: row.placeId,
    name: row.name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
  };
}

export function searchSeededPlaces(
  retailer: string,
  postcode: string,
): NearbyPlace[] {
  const outward = outwardCode(postcode);
  if (!outward) return [];
  return SEEDED_NEARBY.filter(
    (place) => place.retailer === retailer && place.outwardCodes.includes(outward),
  ).map((place) => ({
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
  }));
}

/** Seeded shops first, then live results, with no duplicate names. */
export function mergeSeededPlaces(
  retailer: string,
  postcode: string | undefined,
  places: NearbyPlace[],
): NearbyPlace[] {
  if (!postcode) return places;
  const seeded = searchSeededPlaces(retailer, postcode);
  if (seeded.length === 0) return places;
  const seen = new Set(places.map((p) => p.name.toLowerCase()));
  const extra = seeded.filter((p) => !seen.has(p.name.toLowerCase()));
  return extra.length ? [...extra, ...places] : places;
}
