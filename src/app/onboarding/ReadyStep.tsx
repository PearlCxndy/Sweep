"use client";

import { FALLBACK_SECTION_ORDER, SECTION_WORD, storeName } from "@/domain/types";
import type { Store } from "@/domain/types";
import { ProduceCluster } from "@/components/ProduceCluster";

/**
 * The screen that earns trust, because it says what the app cannot do — before
 * the shopper has invested anything, rather than at a shelf with a trolley.
 */
export function ReadyStep({
  store,
  hasHistory,
  onDone,
}: {
  store: Store | null;
  hasHistory: boolean;
  onDone: () => void;
}) {
  // Named from the real fallback order, so the promise matches the code.
  const sections = FALLBACK_SECTION_ORDER.map((s) =>
    SECTION_WORD[s].toLowerCase(),
  ).join(", ");

  return (
    <div className="relative z-10">
      <h1 className="t-item">Ready</h1>

      <div className="mt-6 flex flex-col gap-3">
        {store ? (
          store.hasLayout ? (
            <p className="t-list flex gap-3 rounded-[18px] bg-white/8 p-4">
              <span className="plate bg-[var(--ripe-strong)] text-[var(--grove)]">✓</span><span>
              We have the layout for {storeName(store)} {store.branch}, so your
              list will sort by aisle.</span></p>
          ) : (
            <p className="t-list rounded-[18px] bg-white/8 p-4">
              No layout for {storeName(store)} {store.branch} yet, so your list
              sorts by section: {sections}. It learns the real order as you
              shop.
            </p>
          )
        ) : (
            <p className="t-list rounded-[18px] bg-white/8 p-4">
            No shop picked, so your list sorts by section: {sections}. You can
            choose a branch whenever you like.
          </p>
        )}

        <p className="t-list rounded-[18px] bg-white/8 p-4">
          {hasHistory
            ? "Suggestions are on, because there are enough shops behind you to see a pattern."
            : "Suggestions are off until we've seen a few shops. No guessing from nothing."}
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="btn btn-56 btn-ripe-on-grove mt-10 w-full"
      >
        Start your list
      </button>
      <ProduceCluster variant="ready" />
    </div>
  );
}
