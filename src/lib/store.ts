"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { orderTripItems } from "@/domain/storeOrder";
import type { Store, Trip, TripItem, UserProfile } from "@/domain/types";
import {
  getPlacements,
  getProducts,
  getStartingList,
  getStore,
} from "@/data/repositories";
import { enqueue } from "./offlineQueue";

/**
 * No branch chosen. A real state, not a broken one: section ordering, and no
 * suggestions because there is no history at a shop we cannot name.
 */
export const NO_STORE: Store = {
  id: "no-store",
  retailer: "other",
  branch: "",
  placeId: null,
  lat: null,
  lng: null,
  hasLayout: false,
};

type SweepState = {
  /** The list waiting for the next shop, in the order it was written. */
  listProductIds: string[];
  /**
   * Said no to for this list. Cleared when the trip finishes — a dismissal is
   * feedback about today, not a deletion.
   */
  dismissedSuggestions: string[];
  /**
   * How many times each suggestion has been turned down, across all lists.
   * Enough of them and the suggestion retires for good.
   */
  dismissalCounts: Record<string, number>;
  /** Inferences the shopper has deleted. Excluded from suggestion inputs. */
  deletedInferenceIds: string[];
  sponsoredEnabled: boolean;
  /** Preferred brands the shopper confirmed after a swap. */
  usualBrand: Record<string, string>;

  /**
   * Onboarding. The card is one flag; coach marks are tracked individually, so
   * a shopper who never hits a gap on a shelf still gets that explanation the
   * first time they do, six weeks in. Nothing here re-fires on an update: a
   * flow that changes enough to need re-explaining gets a new id, not a reset.
   *
   * Local only, like everything else here. `userId` is where a synced install
   * would key this.
   */
  userId: string;
  coachMarksSeen: string[];

  /**
   * Onboarding result. An anonymous local profile — no account, no email, no
   * password. Sign-in exists later, for sync, if the shopper wants it.
   */
  profile: UserProfile | null;
  /** The branch chosen at onboarding. Null means section ordering. */
  chosenStore: Store | null;
  onboardingComplete: boolean;

  trip: Trip | null;
  /** Trips finished in this browser, newest last. Seeded history is separate. */
  completedTrips: Trip[];

  addToList: (productId: string) => void;
  removeFromList: (productId: string) => void;
  dismissSuggestion: (productId: string) => void;
  undoDismiss: (productId: string) => void;
  deleteInference: (id: string) => void;
  setSponsored: (on: boolean) => void;
  setUsualBrand: (forProductId: string, brandProductId: string) => void;
  seeCoachMark: (id: string) => void;
  completeOnboarding: (result: {
    displayName: string | null;
    store: Store | null;
  }) => void;
  resetOnboarding: () => void;
  setChosenStore: (store: Store | null) => void;

  startTrip: (kind: Trip["kind"]) => void;
  /** Rotate the walk to begin at a stop. Null puts the store's order back. */
  startFromStop: (aisleOrder: number | null) => void;
  setStatus: (itemId: string, status: TripItem["status"]) => void;
  substitute: (itemId: string, replacementProductId: string) => void;
  finishTrip: () => void;
  abandonTrip: () => void;
};

let counter = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${counter++}`;

export const useSweep = create<SweepState>()(
  persist(
    (set, get) => ({
      listProductIds: getStartingList(),
      dismissedSuggestions: [],
      dismissalCounts: {},
      deletedInferenceIds: [],
      sponsoredEnabled: true,
      usualBrand: {},
      userId: "local",
      coachMarksSeen: [],
      profile: null,
      chosenStore: null,
      onboardingComplete: false,
      trip: null,
      completedTrips: [],

      addToList: (productId) =>
        set((s) =>
          s.listProductIds.includes(productId)
            ? s
            : {
                listProductIds: [...s.listProductIds, productId],
                dismissedSuggestions: s.dismissedSuggestions.filter(
                  (id) => id !== productId,
                ),
              },
        ),

      removeFromList: (productId) =>
        set((s) => ({
          listProductIds: s.listProductIds.filter((id) => id !== productId),
        })),

      dismissSuggestion: (productId) =>
        set((s) => ({
          dismissedSuggestions: [...s.dismissedSuggestions, productId],
          dismissalCounts: {
            ...s.dismissalCounts,
            [productId]: (s.dismissalCounts[productId] ?? 0) + 1,
          },
        })),

      undoDismiss: (productId) =>
        set((s) => ({
          dismissedSuggestions: s.dismissedSuggestions.filter(
            (id) => id !== productId,
          ),
          dismissalCounts: {
            ...s.dismissalCounts,
            [productId]: Math.max(0, (s.dismissalCounts[productId] ?? 0) - 1),
          },
        })),

      deleteInference: (id) =>
        set((s) => ({
          deletedInferenceIds: [...new Set([...s.deletedInferenceIds, id])],
        })),

      setSponsored: (on) => set({ sponsoredEnabled: on }),

      setUsualBrand: (forProductId, brandProductId) =>
        set((s) => ({
          usualBrand: { ...s.usualBrand, [forProductId]: brandProductId },
        })),

      completeOnboarding: ({ displayName, store }) =>
        set((s) => ({
          // The seeded history belongs to one branch. Anywhere else starts
          // empty, because pretending otherwise would put someone else's
          // shopping on your list.
          listProductIds:
            store?.id === getStore().id ? getStartingList() : [],
          profile: {
            id: s.userId,
            displayName,
            primaryStoreId: store?.id ?? null,
            createdAt: new Date().toISOString(),
          },
          chosenStore: store,
          onboardingComplete: true,
        })),

      resetOnboarding: () =>
        set({
          profile: null,
          chosenStore: null,
          onboardingComplete: false,
        }),

      setChosenStore: (store) => set({ chosenStore: store }),

      seeCoachMark: (id) =>
        set((s) =>
          s.coachMarksSeen.includes(id)
            ? s
            : { coachMarksSeen: [...s.coachMarksSeen, id] },
        ),

      startTrip: (kind) => {
        const store = get().chosenStore ?? NO_STORE;
        const items: TripItem[] = get().listProductIds.map((productId) => ({
          id: nextId("ti"),
          productId,
          quantity: 1,
          status: "pending",
        }));

        set({
          trip: {
            id: nextId("trip"),
            storeId: store.id,
            startedAt: new Date().toISOString(),
            kind,
            items: orderTripItems(items, {
              store,
              placements: getPlacements(),
              catalogue: getProducts(),
            }),
          },
        });
      },

      /**
       * "I'm in aisle 6."
       *
       * Rotates rather than reshuffles, and re-sorts `items` so the array stays
       * the walking order — the invariant everything else reads. The aisles
       * already behind the shopper keep their order and come round at the end,
       * so nothing is lost by starting in the middle.
       */
      startFromStop: (aisleOrder) => {
        const trip = get().trip;
        if (!trip) return;
        const store = get().chosenStore ?? NO_STORE;
        const startAisleOrder = aisleOrder ?? undefined;

        set({
          trip: {
            ...trip,
            startFrom: startAisleOrder,
            items: orderTripItems(trip.items, {
              store,
              placements: getPlacements(),
              catalogue: getProducts(),
              startAisleOrder,
            }),
          },
        });
      },

      setStatus: (itemId, status) => {
        const trip = get().trip;
        if (!trip) return;
        const item = trip.items.find((i) => i.id === itemId);
        if (!item) return;

        // Applied first, queued second. The shelf does not wait for the network.
        set({
          trip: {
            ...trip,
            items: trip.items.map((i) =>
              i.id === itemId ? { ...i, status } : i,
            ),
          },
        });
        enqueue({ tripId: trip.id, itemId, kind: status, productId: item.productId });
      },

      substitute: (itemId, replacementProductId) => {
        const trip = get().trip;
        if (!trip) return;
        const index = trip.items.findIndex((i) => i.id === itemId);
        if (index === -1) return;
        const original = trip.items[index];

        const replacement: TripItem = {
          id: nextId("ti"),
          productId: replacementProductId,
          quantity: original.quantity,
          status: "in_trolley",
          substitutedForId: original.productId,
        };

        const items = [...trip.items];
        items[index] = { ...original, status: "substituted" };
        items.splice(index + 1, 0, replacement);

        set({ trip: { ...trip, items } });
        enqueue({
          tripId: trip.id,
          itemId,
          kind: "substituted",
          productId: replacementProductId,
        });
      },

      finishTrip: () => {
        const trip = get().trip;
        if (!trip) return;
        const completed: Trip = {
          ...trip,
          completedAt: new Date().toISOString(),
        };

        // Anything skipped rolls on to the next list. Nothing is lost by
        // walking past it.
        const skipped = completed.items
          .filter((i) => i.status === "skipped" || i.status === "not_here")
          .map((i) => i.productId);

        set((s) => ({
          trip: null,
          completedTrips: [...s.completedTrips, completed],
          listProductIds: [...new Set(skipped)],
          // A new list gets a fresh hearing. Only the counts carry over.
          dismissedSuggestions: [],
        }));
      },

      abandonTrip: () => set({ trip: null }),
    }),
    { name: "sweep.app", version: 1 },
  ),
);

/** The branch the shopper is actually shopping at, or the no-branch state. */
export function useActiveStore(): Store {
  return useSweep((s) => s.chosenStore) ?? NO_STORE;
}
