
"use client";

import { ProductMark } from "./ProductMark";
import { money } from "@/lib/format";
import type { Ranked } from "@/domain/types";

/**
 * A shelf-edge ticket: white, rounded, picture left, name and price,
 * reason underneath. The recommended one carries a 2px ripe rule —
 * the only 2px border in the product, so it means one thing.
 */
export function SubstituteTicket({
  ranked,
  onChoose,
}: {
  ranked: Ranked;
  onChoose: () => void;
}) {
  const { product, reason, recommended } = ranked;

  return (
    <button
      type="button"
      onClick={onChoose}
      className={`press flex w-full items-center gap-3.5 rounded-[22px] bg-[var(--shelf)] p-3.5 text-left text-[var(--ink)] ${
        recommended ? "border-2 border-[var(--ripe)]" : ""
      }`}
    >
      <ProductMark product={product} size={74} />
      <div className="min-w-0 flex-1">
        {recommended && (
          <p className="t-data text-[var(--ink)]">BEST SWAP</p>
        )}
        <div className="mt-1 flex items-baseline justify-between gap-2.5">
          <span className="t-list leading-snug">{product.name}</span>
          <span className="t-data shrink-0">{money(product.price)}</span>
        </div>
        <p className="t-reason mt-1">{reason}</p>
      </div>
    </button>
  );
}
