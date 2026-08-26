"use client";

import { ProductMark } from "./ProductMark";
import type { Product, UserProductPreference } from "@/domain/types";

/**
 * Rendered when substitutesFor() returns nothing because the shopper protected
 * this item. No alternatives are rendered at all. The note is the shopper's
 * own words and is never rewritten.
 *
 * This is the only screen where --halt appears.
 */
export function LockedItemPanel({
  product,
  preference,
  onInTrolley,
  onSkip,
}: {
  product: Product;
  preference: UserProductPreference;
  onInTrolley: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="grow">
        <p className="t-data text-[var(--halt)]">NEVER SUBSTITUTE</p>

        <div className="mt-5 rounded-[22px] bg-[var(--shelf)] p-5">
          <ProductMark product={product} size={64} />
          <h2 className="t-item mt-4">{product.name}</h2>
          <p className="t-data mt-2 text-[var(--concrete)]">{product.size}</p>

          {preference.note && (
            <p className="t-list mt-5 border-l-2 border-[var(--halt)] pl-3.5 text-[var(--ink)]">
              {preference.note}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-1">
        <button type="button" onClick={onInTrolley} className="btn btn-56 btn-ripe">
          In the trolley
        </button>
        <button type="button" onClick={onSkip} className="btn btn-48 btn-outline">
          Skip and tell her
        </button>
      </div>
    </div>
  );
}
