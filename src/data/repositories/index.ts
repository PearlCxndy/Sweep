/**
 * Repository modules return plain objects. Nothing here knows about React.
 * Swapping the seed for a real API means changing these files only.
 */
import inferencesJson from "../seed/inferences.json";
import listJson from "../seed/list.json";
import metaJson from "../seed/meta.json";
import placementsJson from "../seed/placements.json";
import preferencesJson from "../seed/preferences.json";
import productsJson from "../seed/products.json";
import purchasesJson from "../seed/purchases.json";
import stockJson from "../seed/stock.json";
import sponsoredJson from "../seed/sponsored.json";
import storeJson from "../seed/store.json";
import substitutionsJson from "../seed/substitutions.json";
import tripsJson from "../seed/trips.json";

import type { PriorSubstitution } from "@/domain/substitutions";
import type {
  Inference,
  Product,
  Purchase,
  Store,
  StorePlacement,
  Trip,
  UserProductPreference,
} from "@/domain/types";

export function getStore(): Store {
  return storeJson as Store;
}

export function getProducts(): Product[] {
  return productsJson as Product[];
}

export function getProduct(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function getPlacements(): StorePlacement[] {
  return placementsJson as StorePlacement[];
}

export function getPurchases(): Purchase[] {
  return purchasesJson as Purchase[];
}

export function getTrips(): Trip[] {
  return tripsJson as Trip[];
}

export function getPreferences(): UserProductPreference[] {
  return preferencesJson as UserProductPreference[];
}

export function getPreferenceMap(): Record<string, UserProductPreference> {
  return Object.fromEntries(getPreferences().map((p) => [p.productId, p]));
}

export function getPriorSubstitutions(): PriorSubstitution[] {
  return substitutionsJson as PriorSubstitution[];
}

export function getInferences(): Inference[] {
  return inferencesJson as Inference[];
}

/** Demo rigging: what is not on the shelf at the store today. */
export function getOutOfStock(): string[] {
  return stockJson.outOfStockProductIds;
}

export function isOutOfStock(productId: string): boolean {
  return getOutOfStock().includes(productId);
}

/** The list waiting for the next shop. */
export function getStartingList(): string[] {
  return listJson.productIds;
}

/**
 * At most one sponsored suggestion per trip. It never enters the list order and
 * never appears among substitutions.
 */
export function getSponsored(): { productId: string; reason: string } {
  return sponsoredJson;
}

export function getSeedMeta(): { generated: string; note: string } {
  return metaJson;
}
