"use client";

import { ConfidenceMeter } from "./ConfidenceMeter";
import { FlatProductArt, type FlatProductArtName } from "./ProductMark";
import type { Inference } from "@/domain/types";

/**
 * A claim, what it is based on, and a way to delete it. Deleting removes the
 * claim from the inputs to future suggestions. It is not a settings toggle and
 * there is no "are you sure".
 */
export function InferenceRow({
  inference,
  onDelete,
}: {
  inference: Inference;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-start gap-3.5 rounded-[22px] bg-[var(--shelf)] p-[18px]">
      <InsightMark id={inference.id} />
      <div className="min-w-0 flex-1">
        <p className="t-list leading-snug">{inference.claim}</p>
        <p className="t-data mt-1.5 flex flex-wrap items-center gap-2 text-[var(--concrete)]">
          <span>
            FROM {inference.evidenceCount} {inference.evidenceKind.toUpperCase()}
          </span>
          <ConfidenceMeter confidence={inference.confidence} />
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="plate cross border-[1.5px] border-[var(--concrete)] text-[var(--concrete)]"
        aria-label={`Delete: ${inference.claim}`}
      >
        ×
      </button>
    </li>
  );
}

function InsightMark({ id }: { id: Inference["id"] }) {
  const art: Record<string, FlatProductArtName> = {
    "inf-milk": "milk",
    "inf-own-brand": "bread",
    "inf-saturday": "apple",
    "inf-bread-bananas": "bread",
    "inf-topup": "bananas",
    "inf-cheddar-block": "cheese",
  };
  return (
    <span aria-hidden className="relative inline-block size-11 shrink-0 overflow-hidden rounded-[14px] bg-[#F4F7EA]">
      <FlatProductArt art={art[id] ?? "apple"} />
    </span>
  );
}
