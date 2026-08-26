"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { TripCalendar } from "@/components/TripCalendar";
import type { Trip } from "@/domain/types";
import { getProducts, getTrips } from "@/data/repositories";
import { elapsed, money, shortDate } from "@/lib/format";
import { useSweep } from "@/lib/store";

export default function PastTripsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[var(--wash)]" />}>
      <PastTrips />
    </Suspense>
  );
}

function PastTrips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date") ?? undefined;
  const seeded = getTrips();
  const completedTrips = useSweep((s) => s.completedTrips);
  const listProductIds = useSweep((s) => s.listProductIds);
  const addToList = useSweep((s) => s.addToList);

  const trips: Trip[] = useMemo(
    () => [...seeded, ...completedTrips],
    [seeded, completedTrips],
  );

  const dates = trips
    .map((t) => (t.completedAt ?? t.startedAt ?? "").slice(0, 10))
    .filter(Boolean)
    .sort();
  const lastDate = dates.at(-1);
  const fallbackDate = lastDate ?? new Date().toISOString().slice(0, 10);

  const [month, setMonth] = useState(() =>
    monthFromIso(dateParam ?? fallbackDate),
  );
  const [selected, setSelected] = useState<string | undefined>(
    dateParam ?? lastDate,
  );

  useEffect(() => {
    if (!dateParam) return;
    const hasTrip = trips.some(
      (t) => (t.completedAt ?? t.startedAt ?? "").slice(0, 10) === dateParam,
    );
    const focus = hasTrip ? dateParam : lastDate;
    setSelected(focus);
    setMonth(monthFromIso(hasTrip ? dateParam : fallbackDate));
  }, [dateParam, trips, lastDate, fallbackDate]);

  const catalogue = getProducts();
  const byId = useMemo(
    () => new Map(catalogue.map((p) => [p.id, p])),
    [catalogue],
  );

  const planned = useMemo(() => {
    const d = Date.parse(`${fallbackDate}T00:00:00Z`) + 14 * 86_400_000;
    return new Date(d).toISOString().slice(0, 10);
  }, [fallbackDate]);

  const chosen = trips.find(
    (t) => (t.completedAt ?? t.startedAt ?? "").slice(0, 10) === selected,
  );

  const swaps = chosen?.items.filter((i) => i.substitutedForId) ?? [];
  const skips =
    chosen?.items.filter(
      (i) => i.status === "skipped" || i.status === "not_here",
    ) ?? [];
  const trolley = chosen?.items.filter((i) => i.status === "in_trolley") ?? [];

  function repeat() {
    if (!chosen) return;
    for (const item of chosen.items) {
      if (item.status === "in_trolley") addToList(item.productId);
    }
    router.push("/");
  }

  const monthLabel = month.toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });

  function shiftMonth(by: number) {
    setMonth(
      (m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + by, 1)),
    );
  }

  const duration =
    chosen?.startedAt && chosen.completedAt
      ? elapsed(chosen.startedAt, chosen.completedAt)
      : null;

  return (
    <AppShell current="trips">
      <main className="mx-auto w-full max-w-[560px] px-5 pt-4 pb-8 lg:max-w-[640px] lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between">
          <h1 className="t-item">Past trips</h1>
          <div className="flex h-10 items-center rounded-[14px] bg-[var(--ink)] pl-3.5 text-[var(--paper)]">
            <span className="pr-1">{monthLabel}</span>
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="inline-flex h-10 min-w-[36px] items-center justify-center text-[var(--paper)]"
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="inline-flex h-10 min-w-[36px] items-center justify-center text-[var(--paper)]"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] bg-[var(--shelf)] px-4 py-5">
          <TripCalendar
            month={month}
            trips={trips}
            plannedDate={planned}
            selected={selected}
            onSelect={setSelected}
          />
          <p className="t-data mt-4 flex flex-wrap gap-3.5 border-t border-black/10 pt-3 text-[var(--concrete)]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-[4px] bg-[var(--ripe)]" />
              BIG SHOP
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-[4px] bg-[var(--ripe-wash)]" />
              TOP-UP
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-[4px] border-[1.5px] border-dashed border-[var(--concrete)]" />
              PLANNED
            </span>
          </p>
        </div>

        {chosen ? (
          <section className="mt-4 rounded-[24px] bg-[var(--shelf)] p-[18px]">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="t-title text-[19px]">
                {weekday(selected!)} {shortDate(selected!)}
              </h2>
              {duration && (
                <span className="t-data text-[var(--concrete)]">
                  {duration.toUpperCase()}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <Stat value={trolley.length} label="in the trolley" />
              <Stat value={swaps.length} label="swapped" />
              <Stat value={skips.length} label="skipped" />
            </div>

            {(swaps.length > 0 || skips.length > 0) && (
              <ul className="mt-3.5">
                {swaps.map((item) => {
                  const put = byId.get(item.productId);
                  const was = byId.get(item.substitutedForId!);
                  return (
                    <li
                      key={item.id}
                      className="flex items-baseline justify-between gap-3 border-t border-black/10 py-2.5"
                    >
                      <div>
                        <p className="t-list">{put?.name}</p>
                        <p className="t-reason mt-0.5">
                          swapped in for {was?.name}
                        </p>
                      </div>
                      {put && (
                        <span className="t-data text-[var(--concrete)]">
                          {money(put.price)}
                        </span>
                      )}
                    </li>
                  );
                })}
                {skips.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 border-t border-black/10 py-2.5"
                  >
                    <div>
                      <p className="t-list">
                        {byId.get(item.productId)?.name}
                      </p>
                      <p className="t-reason mt-0.5">
                        skipped — not on the shelf
                      </p>
                    </div>
                    <span className="t-data text-[var(--concrete)]">—</span>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={repeat}
              className="btn btn-48 btn-ripe mt-4 w-full"
            >
              Repeat this shop
            </button>
            <p className="t-reason mt-2">
              Adds {trolley.length} items to your list. You have{" "}
              {listProductIds.length} on it now.
            </p>
          </section>
        ) : (
          <p className="t-reason mt-8">No shop on that day.</p>
        )}
      </main>
    </AppShell>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[14px] bg-[var(--ripe-wash)] p-2.5">
      <p className="font-[family-name:var(--font-mono)] text-[20px] leading-none">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-[var(--concrete)]">{label}</p>
    </div>
  );
}

function weekday(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  });
}

function monthFromIso(iso: string): Date {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
