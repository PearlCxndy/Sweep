"use client";

import { ConfidenceMeter } from "./ConfidenceMeter";
import { ProductMark, SECTION_WASH } from "./ProductMark";
import type { Product, Suggestion } from "@/domain/types";

/**
 * Four states, one component. Dismiss is a 44px filled plate, top-right,
 * away from the full-width add so a mis-tap cannot discard a suggestion.
 */
export type SuggestionCardState =
  | "offered"
  | "unsure"
  | "added"
  | "dismissed";

export function SuggestionCard({
  suggestion,
  product,
  state,
  sponsored = false,
  addedTo,
  layout = "row",
  onAdd,
  onDismiss,
  onUndo,
}: {
  suggestion: Suggestion;
  product: Product;
  state: SuggestionCardState;
  sponsored?: boolean;
  addedTo?: string;
  layout?: "row" | "tile";
  onAdd: () => void;
  onDismiss: () => void;
  onUndo: () => void;
}) {
  if (state === "dismissed") {
    return (
      <div className="fade-in flex items-center gap-3 rounded-[22px] bg-[var(--shelf)] px-4 py-3.5">
        <span className="plate cross bg-[var(--wash)] text-[var(--concrete)]">
          ×
        </span>
        <div className="min-w-0 flex-1">
          <p className="t-list">{shortName(product.name)} dismissed</p>
          <p className="t-reason mt-0.5">
            sweep will stop suggesting it for now.
          </p>
        </div>
        <Undo onClick={onUndo} />
      </div>
    );
  }

  if (state === "added") {
    return (
      <div className="fade-in flex items-center gap-3 rounded-[22px] bg-[var(--ripe-wash)] px-4 py-3.5">
        <span className="plate bg-[var(--ripe)] t-data">✓</span>
        <p className="t-list min-w-0 flex-1">
          {shortName(product.name)} added
          {addedTo ? ` to ${addedTo}` : ""}
        </p>
        <Undo onClick={onUndo} />
      </div>
    );
  }

  const unsure = state === "unsure";
  const tile = layout === "tile";

  return (
    <div
      className="fade-in flex h-full flex-col gap-3 rounded-[22px] p-4"
      style={{
        background: tile ? SECTION_WASH[product.category] : "var(--shelf)",
      }}
    >
      <div className={`flex ${tile ? "flex-col" : "items-start"} gap-3`}>
        <ProductMark
          product={product}
          size={tile ? 74 : 52}
          className={tile ? "w-full !h-[74px]" : ""}
        />
        <div className="min-w-0 flex-1">
          <p className="t-list leading-snug [overflow-wrap:anywhere] line-clamp-2">
            {shortName(product.name)}
          </p>
          {!tile && (
            <p className="t-reason mt-1.5 line-clamp-2">{suggestion.reason}</p>
          )}
          <div className={tile ? "mt-1" : "mt-2"}>
            {sponsored ? (
              <p className="t-data text-[var(--concrete)]">SPONSORED</p>
            ) : (
              <ConfidenceMeter
                confidence={suggestion.confidence}
                labelled
              />
            )}
          </div>
        </div>
        {!tile && (
          <button
            type="button"
            onClick={onDismiss}
            className="plate cross bg-[var(--wash)] text-[var(--ink)]"
            aria-label={`Not this time: ${product.name}`}
          >
            ×
          </button>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={onAdd}
          className={`btn btn-48 flex-1 ${
            unsure ? "btn-outline" : "btn-ripe"
          }`}
        >
          Add
        </button>
        {tile && (
          <button
            type="button"
            onClick={onDismiss}
            className="plate cross border-[1.5px] border-[var(--concrete)] text-[var(--concrete)]"
            aria-label={`Not this time: ${product.name}`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function Undo({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="t-list min-h-[44px] border-b-[1.5px] border-[var(--ink)] px-0.5"
    >
      Undo
    </button>
  );
}

function shortName(name: string): string {
  return name.replace(/^Tesco\s+/i, "").replace(/^Warburtons\s+/i, "");
}
