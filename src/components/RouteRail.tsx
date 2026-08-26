"use client";

import { useState } from "react";

import { Fab } from "./Fab";
import type { Basket } from "@/domain/basket";
import type { RouteStop, RouteStopItem } from "@/domain/route";
import { money, plural } from "@/lib/format";

/**
 * Where you are in the shop.
 *
 * Trip mode shows one item, which is the right amount to act on and the wrong
 * amount to feel oriented by. The rail is the walk: stops behind you, the one
 * you are standing in, and what is still to come. Collapsed it is a single row
 * of aisle numbers; the mini FAB opens the detail.
 *
 * Opened, every line is a button. A shopper does not walk the route we drew —
 * they walk past the bread on the way to the milk and pick it up because it is
 * there. Reordering a list one-handed with a trolley in the other is the wrong
 * answer to that; taking the item you are already looking at is the right one.
 * Nothing is moved, so nothing has to be moved back.
 */
export function RouteRail({
  stops,
  currentItemId,
  onJump,
  onStartHere,
  rotated = false,
  spend,
}: {
  stops: RouteStop[];
  currentItemId?: string;
  onJump?: (itemId: string) => void;
  /** Begin the walk at this stop. Null puts the store's own order back. */
  onStartHere?: (order: number | null) => void;
  /** Whether the walk has already been rotated, so it can be put back. */
  rotated?: boolean;
  /** The header has room for the trolley; the panel has room to explain it. */
  spend?: Basket;
}) {
  const [open, setOpen] = useState(false);
  if (stops.length === 0) return null;

  const currentIndex = stops.findIndex((s) => s.status === "current");
  const position = currentIndex === -1 ? stops.length : currentIndex + 1;
  const current = stops[currentIndex];

  function jump(itemId: string) {
    onJump?.(itemId);
    setOpen(false);
  }

  function startHere(order: number | null) {
    onStartHere?.(order);
    setOpen(false);
  }

  return (
    <section
      aria-label="Route through the shop"
      className="rounded-[18px] bg-[color-mix(in_srgb,var(--paper)_10%,transparent)] px-3 py-2.5"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="t-data text-[color-mix(in_srgb,var(--paper)_60%,transparent)]">
            STOP {position} OF {stops.length}
            {current && current.total > 1
              ? ` · ${current.total - current.done} LEFT HERE`
              : ""}
          </p>

          <ol className="mt-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {stops.map((stop) => (
              <li key={stop.key} className="shrink-0">
                <span
                  aria-hidden
                  className={`t-data flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 ${
                    stop.status === "current"
                      ? "bg-[var(--ripe)] text-[var(--ink)]"
                      : stop.status === "done"
                        ? "bg-[color-mix(in_srgb,var(--paper)_18%,transparent)] text-[color-mix(in_srgb,var(--paper)_50%,transparent)]"
                        : "bg-[color-mix(in_srgb,var(--paper)_10%,transparent)] text-[color-mix(in_srgb,var(--paper)_75%,transparent)]"
                  }`}
                >
                  {stop.aisle ?? "·"}
                </span>
                <span className="sr-only">
                  {stop.aisle === null
                    ? stop.section
                    : `Aisle ${stop.aisle}, ${stop.section}`}
                  , {stop.done} of {stop.total} done,{" "}
                  {stop.status === "current"
                    ? "you are here"
                    : stop.status === "done"
                      ? "behind you"
                      : "ahead"}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <Fab
          size="mini"
          icon={open ? "▴" : "▾"}
          label={open ? "Hide the route" : "Take something out of order"}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="border border-[color-mix(in_srgb,var(--paper)_30%,transparent)]"
        />
      </div>

      {open && (
        <div className="fade-in mt-2.5 border-t border-[color-mix(in_srgb,var(--paper)_15%,transparent)] pt-2">
          <p className="t-data pb-1 text-[color-mix(in_srgb,var(--paper)_50%,transparent)]">
            TAP AN AISLE TO START THERE, OR A LINE TO TAKE IT NOW
          </p>
          {spend && (
            <p className="t-data pb-1.5 text-[color-mix(in_srgb,var(--paper)_60%,transparent)]">
              {money(spend.inTrolley)} IN THE TROLLEY ·{" "}
              {money(spend.remaining)} STILL TO COME
              {spend.unpriced > 0
                ? ` · ${spend.unpriced} ${plural(spend.unpriced, "LINE", "LINES")} WITH NO PRICE`
                : ""}
            </p>
          )}
          <div className="max-h-[46dvh] overflow-y-auto no-scrollbar">
            {stops.map((stop) => (
              <section key={stop.key} className="pt-1.5">
                <StopHeading
                  stop={stop}
                  onStartHere={
                    onStartHere && stop.status !== "current"
                      ? () => startHere(stop.order)
                      : undefined
                  }
                />
                <ol>
                  {stop.items.map((item) => (
                    <li key={item.id}>
                      <ItemRow
                        item={item}
                        isCurrent={item.id === currentItemId}
                        onJump={() => jump(item.id)}
                      />
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>

          {rotated && onStartHere && (
            <button
              type="button"
              onClick={() => startHere(null)}
              className="press t-data mt-1 flex min-h-11 w-full items-center justify-between gap-3 border-t border-[color-mix(in_srgb,var(--paper)_15%,transparent)] px-2 pt-2 text-left text-[color-mix(in_srgb,var(--paper)_60%,transparent)]"
            >
              <span>ROUTE STARTS WHERE YOU JOINED IT</span>
              <span className="text-[var(--ripe)]">PUT IT BACK</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * The aisle heading, which is also how you say "I'm here".
 *
 * A shopper who has walked into the wrong end of the shop does not want to
 * take one item out of order eleven times. They want the route to admit where
 * they are standing and carry on from there.
 */
function StopHeading({
  stop,
  onStartHere,
}: {
  stop: RouteStop;
  onStartHere?: () => void;
}) {
  const name =
    stop.aisle === null
      ? stop.section.toUpperCase()
      : `${stop.aisle} · ${stop.section.toUpperCase()}`;

  const count = (
    <span className="t-data shrink-0 text-[color-mix(in_srgb,var(--paper)_45%,transparent)]">
      {stop.done}/{stop.total}
    </span>
  );

  if (!onStartHere) {
    return (
      <div className="flex items-baseline justify-between gap-3 pb-0.5">
        <span className="t-data text-[color-mix(in_srgb,var(--paper)_60%,transparent)]">
          {name}
          {stop.status === "current" ? " · HERE" : ""}
        </span>
        {count}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onStartHere}
      className="press flex min-h-11 w-full items-baseline justify-between gap-3 rounded-xl px-2 pb-0.5 text-left"
    >
      <span className="t-data min-w-0 truncate text-[color-mix(in_srgb,var(--paper)_60%,transparent)]">
        {name}
      </span>
      <span className="t-data shrink-0 text-[var(--ripe)]">START HERE</span>
      {count}
    </button>
  );
}

function ItemRow({
  item,
  isCurrent,
  onJump,
}: {
  item: RouteStopItem;
  isCurrent: boolean;
  onJump: () => void;
}) {
  const settled = item.status !== "pending" && item.status !== "not_here";

  return (
    <button
      type="button"
      onClick={onJump}
      aria-current={isCurrent ? "true" : undefined}
      className={`press flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2 text-left ${
        isCurrent ? "bg-[color-mix(in_srgb,var(--paper)_12%,transparent)]" : ""
      }`}
    >
      <span
        aria-hidden
        className={`t-data flex size-5 shrink-0 items-center justify-center rounded-md ${
          settled
            ? "bg-[var(--ripe)] text-[var(--ink)]"
            : "border border-[color-mix(in_srgb,var(--paper)_28%,transparent)]"
        }`}
      >
        {settled ? "✓" : ""}
      </span>
      <span
        className={`t-list min-w-0 flex-1 truncate ${
          settled
            ? "text-[color-mix(in_srgb,var(--paper)_45%,transparent)] line-through"
            : ""
        }`}
      >
        {item.name}
        {item.quantity > 1 ? ` ×${item.quantity}` : ""}
      </span>
      <span className="t-data shrink-0 text-[color-mix(in_srgb,var(--paper)_50%,transparent)]">
        {isCurrent
          ? "ON SCREEN"
          : settled
            ? statusWord(item.status)
            : "TAKE IT"}
      </span>
    </button>
  );
}

function statusWord(status: RouteStopItem["status"]): string {
  if (status === "in_trolley") return "IN";
  if (status === "skipped") return "SKIPPED";
  if (status === "substituted") return "SWAPPED";
  return "";
}
