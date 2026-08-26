"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { CategoryMark, categoryMarkForSection } from "./CategoryMark";
import {
  ProductMark,
  SECTION_WASH,
} from "./ProductMark";
import { squarify } from "@/domain/treemap";
import type { groupByAisle } from "@/domain/storeOrder";
import type { Product, SectionKey, UserProductPreference } from "@/domain/types";

type Group = ReturnType<typeof groupByAisle>[number];

/**
 * The list as blocks, sized by how much of the shop each aisle is.
 *
 * A fixed grid leaves ragged space at the bottom and gives an aisle with one
 * item the same weight as an aisle with five. A treemap fills the rectangle
 * exactly and makes the big aisles look big, which is the useful thing to know
 * before you set off.
 *
 * Order is walking order, always. See domain/treemap.ts for why that costs a
 * little aspect-ratio quality and why it is worth it.
 */
export function AisleTreemap({
  groups,
  byId,
  prefs,
  onRemove,
}: {
  groups: Group[];
  byId: Map<string, Product>;
  prefs: Record<string, UserProductPreference>;
  onRemove: (productId: string) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const detail = useMemo(() => {
    const rows = groups.map((group) => {
      const products = group.items
        .map((i) => byId.get(i.productId))
        .filter((p): p is Product => Boolean(p));
      return {
        group,
        products,
        categoryMark: categoryMarkForSection(group.section),
        locked: products.some((p) => prefs[p.id]?.neverSubstitute),
        section: (products[0]?.category ?? "cupboard") as SectionKey,
      };
    });
    return rows;
  }, [groups, byId, prefs]);

  const tiles = useMemo(
    () =>
      squarify(
        detail.map((d) => ({ key: d.group.key, weight: d.products.length })),
        100,
        100,
      ),
    [detail],
  );

  if (detail.length === 0) return null;

  const open = detail.find((d) => d.group.key === openKey) ?? null;

  return (
    <div>
      <div className="relative mt-3 aspect-[4/5] w-full sm:aspect-[3/2] lg:aspect-[2/1]">
        {tiles.map((tile) => {
          const row = detail.find((d) => d.group.key === tile.key);
          if (!row) return null;

          const { group, products, categoryMark, locked, section } = row;
          const share = (tile.width * tile.height) / (100 * 100);
          const roomy = share >= 0.15;
          const isOpen = openKey === group.key;

          return (
            <div
              key={tile.key}
              className="absolute"
              style={{
                left: `${tile.x}%`,
                top: `${tile.y}%`,
                width: `${tile.width}%`,
                height: `${tile.height}%`,
              }}
            >
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : group.key)}
                aria-expanded={isOpen}
                aria-label={`${group.section}, ${products.length} ${
                  products.length === 1 ? "item" : "items"
                }${locked ? ", locked" : ""}`}
                style={
                  {
                    "--tile": locked ? "var(--paper)" : SECTION_WASH[section],
                  } as CSSProperties
                }
                className={`press absolute inset-[2px] flex flex-col justify-between overflow-hidden rounded-[18px] bg-[var(--tile)] p-3 text-left ${
                  locked ? "border border-black/25" : ""
                } ${isOpen ? "outline-2 outline-offset-[-2px] outline-[var(--ink)]" : ""}`}
              >
                <span className="flex items-start justify-between gap-2">
                  {roomy &&
                    (categoryMark ? (
                      <CategoryMark
                        name={categoryMark}
                        size={36}
                        className="!bg-white/60"
                      />
                    ) : (
                      <ProductMark
                        section={section}
                        size={36}
                        className="!bg-white/60"
                      />
                    ))}
                  <span className="t-data ml-auto shrink-0 text-[var(--concrete)]">
                    {group.aisle === null ? "—" : group.aisle}
                  </span>
                </span>

                <span className="min-w-0">
                  <span className="t-list block truncate leading-tight">
                    {group.section}
                  </span>
                  <span className="t-data mt-0.5 block text-[var(--concrete)]">
                    {products.length}
                    {locked ? " · LOCKED" : ""}
                  </span>
                  {roomy && (
                    <span className="t-reason mt-1 line-clamp-2 block">
                      {products.map((p) => shortName(p.name)).join(", ")}
                    </span>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {open ? (
        <div className="fade-in mt-3 rounded-[22px] bg-[var(--shelf)] p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="t-list">{open.group.section}</p>
            <p className="t-data text-[var(--concrete)]">
              {open.group.aisle === null
                ? "NO AISLE DATA"
                : `AISLE ${open.group.aisle}`}
            </p>
          </div>

          {open.locked && (
            <p className="t-reason mt-2">
              {open.products
                .map((p) => prefs[p.id]?.note)
                .find(Boolean) ?? "Protected from substitutions."}
            </p>
          )}

          <ul className="mt-2">
            {open.products.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-2 border-t border-black/10 py-2"
              >
                <span className="t-list min-w-0 leading-snug">
                  {shortName(product.name)}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <span className="t-data text-[var(--concrete)]">
                    {product.size}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(product.id)}
                    aria-label={`Remove ${product.name}`}
                    className="plate cross text-[var(--concrete)]"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="t-reason mt-3">Tap an aisle to see what is in it.</p>
      )}
    </div>
  );
}

/** "Tesco semi-skimmed milk" reads as "Semi-skimmed milk" once in a Tesco. */
function shortName(name: string): string {
  return name.replace(/^Tesco\s+/i, "").replace(/^\w/, (c) => c.toUpperCase());
}
