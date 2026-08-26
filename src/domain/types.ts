export type SectionKey =
  | "fresh"
  | "bakery"
  | "dairy"
  | "cupboard"
  | "frozen"
  | "household";

/** Fallback walking order when a store's layout is unknown. */
export const FALLBACK_SECTION_ORDER: SectionKey[] = [
  "fresh",
  "bakery",
  "dairy",
  "cupboard",
  "frozen",
  "household",
];

export const SECTION_WORD: Record<SectionKey, string> = {
  fresh: "Fresh",
  bakery: "Bakery",
  dairy: "Dairy",
  cupboard: "Cupboard",
  frozen: "Frozen",
  household: "Household",
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  ownBrand: boolean;
  size: string;
  /** Set for liquids, so same-product-different-size logic can divide. */
  unitMl?: number;
  category: SectionKey;
  dietaryTags: string[];
  /** Pence. */
  price: number;
  /** Groups variants of one product line, e.g. "tesco-semi-skimmed". */
  lineId?: string;
  /**
   * What kind of thing this is, for substitution: "milk", "poultry", "pasta".
   *
   * Category is too coarse to swap on. `fresh` holds fruit, veg, meat and fish,
   * so a category-only pool will happily offer lemons for pork chops. Category
   * still drives aisle fallback ordering; this drives what may replace what.
   */
  group?: string;
  /** Distinguishing attributes within a section, e.g. { fat: "semi-skimmed" }. */
  attributes?: Record<string, string>;
};

export type Retailer =
  | "tesco"
  | "sainsburys"
  | "asda"
  | "aldi"
  | "lidl"
  | "morrisons"
  | "coop"
  | "waitrose"
  | "other";

/** How each retailer writes its own name. Display only. */
export const RETAILER_NAMES: Record<Retailer, string> = {
  tesco: "Tesco",
  sainsburys: "Sainsbury's",
  asda: "Asda",
  aldi: "Aldi",
  lidl: "Lidl",
  morrisons: "Morrisons",
  coop: "Co-op Food",
  waitrose: "Waitrose",
  other: "Somewhere else",
};

export const RETAILERS = Object.keys(RETAILER_NAMES) as Retailer[];

/**
 * A branch, not a chain. A product does not have an aisle globally — it has an
 * aisle at a store — and that is only true if "store" means one shop. Tesco
 * Express 262 Poplar High St and Tesco Metro Liverpool Street have different footprints
 * and completely different walking orders.
 */
export type Store = {
  id: string;
  retailer: Retailer;
  /** "Express 262 Poplar High St" — the retailer name is not repeated here. */
  branch: string;
  /** Google place_id. Null when the shopper skipped the map. */
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  /** Whether we hold a placement table for this branch. */
  hasLayout: boolean;
};

export function storeName(store: Store): string {
  return RETAILER_NAMES[store.retailer];
}

/** One line naming the branch, or saying plainly that none was picked. */
export function storeLabel(store: Store): string {
  if (!store.branch) return "No shop picked";
  return `${RETAILER_NAMES[store.retailer]} ${store.branch}`;
}

/**
 * Cosmetic only. `displayName` personalises one line of copy: no feature reads
 * it and no query filters on it, which is why it is allowed to be null.
 */
export type UserProfile = {
  id: string;
  displayName: string | null;
  primaryStoreId: string | null;
  createdAt: string;
};

export type StorePlacement = {
  storeId: string;
  productId: string;
  aisle: number;
  section: string;
  /** Walking order through the shop. */
  aisleOrder: number;
};

export type Purchase = {
  id: string;
  productId: string;
  storeId: string;
  tripId: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
};

export type UserProductPreference = {
  productId: string;
  neverSubstitute: boolean;
  /** Shown verbatim. The user's own words, never rewritten. */
  note?: string;
  preferredBrand?: string;
  preferredSize?: string;
};

export type TripItemStatus =
  | "pending"
  | "in_trolley"
  | "not_here"
  | "substituted"
  | "skipped";

export type TripItem = {
  id: string;
  productId: string;
  quantity: number;
  status: TripItemStatus;
  /** Set on the replacement item: the id of the product it stood in for. */
  substitutedForId?: string;
};

export type Trip = {
  id: string;
  storeId: string;
  startedAt?: string;
  completedAt?: string;
  kind: "big" | "topup";
  /** In walking order. See `orderTripItems`, and `startFrom` below. */
  items: TripItem[];
  /**
   * Where the walk begins, as an aisle's `aisleOrder`.
   *
   * A shopper who comes in the far door, or who has already wandered into
   * aisle 6, is not walking the route from the top. Setting this rotates the
   * whole walk to start at that aisle and carry on in store order, wrapping
   * round to the aisles behind them at the end. Undefined means the route
   * starts where the store's own order starts.
   */
  startFrom?: number;
};

export type Confidence = "high" | "medium" | "low";

export type Inference = {
  id: string;
  claim: string;
  evidenceCount: number;
  evidenceKind: "purchases" | "trips";
  confidence: Confidence;
  deleted: boolean;
  /**
   * The products this claim rests on. Deleting the claim takes them out of the
   * inputs to suggestions, which is what makes the delete control mean
   * something rather than being a settings toggle.
   */
  basis: string[];
};

export type Suggestion = {
  productId: string;
  reason: string;
  confidence: Confidence;
  medianInterval: number;
  daysSince: number;
  overdueBy: number;
  observations: number;
};

export type Ranked = {
  product: Product;
  score: number;
  /** Never optional. A result without a reason is a bug, not a fallback. */
  reason: string;
  recommended: boolean;
};
