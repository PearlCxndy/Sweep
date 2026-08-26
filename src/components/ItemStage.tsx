import type { ReactNode, RefObject } from "react";

import { ProductMark } from "./ProductMark";
import { money } from "@/lib/format";
import type { Product } from "@/domain/types";

/**
 * One item, big, alone. Everything the shopper needs to recognise it on a
 * shelf and nothing else: what it is, what size, whose brand.
 */
export function ItemStage({
  product,
  quantity,
  usualBrand,
  next,
  markRef,
}: {
  product: Product;
  quantity: number;
  usualBrand?: string;
  next?: Product;
  /** The thing that falls when the item goes in the trolley. */
  markRef?: RefObject<HTMLDivElement | null>;
}) {
  const brand = usualBrand ?? product.brand;

  return (
    <div className="flex grow flex-col">
      <div className="mt-5 rounded-[24px] bg-white/6 p-[18px]">
        <div
          ref={markRef}
          className="flex h-[150px] items-center justify-center rounded-2xl bg-white/5"
        >
          <ProductMark product={product} size={128} className="!rounded-[22px]" />
        </div>
        <h1 className="t-item mt-4">{product.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip>{product.size}</Chip>
          <Chip>{product.ownBrand && !usualBrand ? "OWN-BRAND" : brand}</Chip>
          <Chip>{money(product.price)}</Chip>
          {quantity > 1 && <Chip>×{quantity}</Chip>}
        </div>
      </div>

      {next && (
        <p className="mt-4 flex items-center gap-2.5 text-[13px] text-[var(--concrete)]">
          <ProductMark product={next} size={44} className="!rounded-full" />
          Next: {next.name}
        </p>
      )}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="t-data rounded-[10px] bg-white/10 px-2.5 py-1.5 text-[var(--paper)]">
      {children}
    </span>
  );
}
