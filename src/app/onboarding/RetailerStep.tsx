"use client";

import { useEffect, useRef, useState } from "react";

import { RETAILERS, RETAILER_NAMES } from "@/domain/types";
import type { Retailer } from "@/domain/types";

/**
 * Single select. Real buttons with aria-pressed, roving tabindex so the grid
 * is one tab stop, and arrow keys to move within it.
 *
 * Selection is never signalled by fill alone: the chosen chip also changes
 * border weight, so it survives a monochrome or colour-blind reading.
 */
export function RetailerStep({
  initial,
  onNext,
  onSkip,
}: {
  initial: Retailer | null;
  onNext: (retailer: Retailer) => void;
  onSkip: () => void;
}) {
  const [selected, setSelected] = useState<Retailer | null>(initial);
  const [focusIndex, setFocusIndex] = useState(() => {
    const i = initial ? RETAILERS.indexOf(initial) : 0;
    return i === -1 ? 0 : i;
  });
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const moved = useRef(false);

  useEffect(() => {
    // Only pull focus once the shopper has started arrowing around, never on
    // first render — that would steal focus from the heading.
    if (moved.current) refs.current[focusIndex]?.focus();
  }, [focusIndex]);

  function onKeyDown(event: React.KeyboardEvent) {
    const columns = 2;
    const last = RETAILERS.length - 1;
    let next = focusIndex;

    switch (event.key) {
      case "ArrowRight":
        next = Math.min(last, focusIndex + 1);
        break;
      case "ArrowLeft":
        next = Math.max(0, focusIndex - 1);
        break;
      case "ArrowDown":
        next = Math.min(last, focusIndex + columns);
        break;
      case "ArrowUp":
        next = Math.max(0, focusIndex - columns);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    moved.current = true;
    setFocusIndex(next);
    setSelected(RETAILERS[next]);
  }

  return (
    <div>
      <h1 className="t-item">Which supermarket?</h1>
      <p className="t-reason mt-2">
        The one you do the big shop at. You can add others later.
      </p>

      <div
        role="group"
        aria-label="Supermarket"
        onKeyDown={onKeyDown}
        className="mt-6 grid grid-cols-2 gap-2.5"
      >
        {RETAILERS.map((retailer, i) => {
          const isSelected = selected === retailer;
          return (
            <button
              key={retailer}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              aria-pressed={isSelected}
              tabIndex={i === focusIndex ? 0 : -1}
              onFocus={() => setFocusIndex(i)}
              onClick={() => {
                moved.current = false;
                setSelected(retailer);
                setFocusIndex(i);
              }}
              className={`t-list flex min-h-[56px] items-center justify-center rounded-2xl px-3 text-center ${retailer === "other" ? "col-span-2" : ""} ${
                isSelected
                  ? "border-[2.5px] border-[var(--ink)] bg-[var(--ripe-wash)]"
                  : "border-[1.5px] border-[var(--concrete)] bg-transparent"
              }`}
            >
              {RETAILER_NAMES[retailer]}
            </button>
          );
        })}
      </div>

      <aside className="mt-4 rounded-[18px] bg-[var(--shelf)] p-4">
        <p className="t-reason text-[var(--ink)]">Layouts differ by chain <em>and</em> by branch. Sweep learns one shop properly rather than guessing at all of them.</p>
      </aside>

      <div className="mt-8 flex flex-col gap-2">
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && onNext(selected)}
          className="btn btn-56 btn-ink w-full"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="btn btn-48 btn-ghost w-full"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
