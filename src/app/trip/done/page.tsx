"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CoachMark } from "@/components/CoachMark";
import type { Trip } from "@/domain/types";
import { getProducts, getStore } from "@/data/repositories";
import { basket } from "@/domain/basket";
import { elapsed, money, plural } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { COACH_MARKS } from "@/domain/onboarding";
import { storeLabel } from "@/domain/types";
import { useSweep } from "@/lib/store";

export default function TripDone() {
  const router = useRouter();
  const trip = useSweep((s) => s.trip);
  const completedTrips = useSweep((s) => s.completedTrips);
  const finishTrip = useSweep((s) => s.finishTrip);
  const setUsualBrand = useSweep((s) => s.setUsualBrand);
  const usualBrand = useSweep((s) => s.usualBrand);

  const mounted = useHydrated();
  const [answered, setAnswered] = useState(false);
  const written = useRef(false);

  useEffect(() => {
    if (!mounted || written.current || !trip) return;
    written.current = true;
    finishTrip();
  }, [mounted, trip, finishTrip]);

  const completed: Trip | undefined = completedTrips.at(-1);

  useEffect(() => {
    if (mounted && !trip && !completed) router.replace("/");
  }, [mounted, trip, completed, router]);

  const catalogue = getProducts();
  const byId = useMemo(
    () => new Map(catalogue.map((p) => [p.id, p])),
    [catalogue],
  );

  if (!mounted || !completed) {
    return <div className="min-h-dvh bg-[var(--wash)]" />;
  }

  const inTrolley = completed.items.filter((i) => i.status === "in_trolley");
  const swaps = completed.items.filter((i) => i.substitutedForId);
  const skipped = completed.items.filter(
    (i) => i.status === "skipped" || i.status === "not_here",
  );

  const time =
    completed.startedAt && completed.completedAt
      ? elapsed(completed.startedAt, completed.completedAt)
      : null;

  // The number that ran along the top of every item screen has to land
  // somewhere, or it reads as a gauge that was never really counting.
  const spend = basket(completed.items, catalogue);

  const swap = swaps[0];
  const swapReplacement = swap ? byId.get(swap.productId) : undefined;
  const swapOriginal = swap?.substitutedForId
    ? byId.get(swap.substitutedForId)
    : undefined;
  const alreadyAnswered =
    answered || (swapOriginal ? swapOriginal.id in usualBrand : false);

  return (
    <AppShell current="list">
      <main className="mx-auto w-full max-w-[560px] px-5 pt-6 pb-12 lg:max-w-none lg:px-8 lg:pt-8">
        <h1 className="t-item">That&apos;s the shop</h1>
        <p className="t-reason mt-2">
          {time ? `${time} in ${storeLabel(getStore())}` : storeLabel(getStore())}
          {" · "}
          {money(spend.inTrolley)} in the trolley
          {spend.unpriced > 0
            ? `, plus ${spend.unpriced} ${plural(spend.unpriced, "line", "lines")} with no price`
            : ""}
          .
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          <Stat value={inTrolley.length} label="in the trolley" />
          <Stat value={swaps.length} label="swapped" />
          <Stat value={skipped.length} label="skipped" />
        </div>

        {swap && swapReplacement && swapOriginal && !alreadyAnswered && (
          <section className="mt-6 rounded-[22px] bg-[var(--shelf)] p-5">
            <p className="t-list">
              Keep {swapReplacement.brand} as the usual?
            </p>
            <p className="t-reason mt-1">Instead of {swapOriginal.name}.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsualBrand(swapOriginal.id, swapReplacement.id);
                  setAnswered(true);
                }}
                className="btn btn-48 btn-ripe flex-1"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setAnswered(true)}
                className="btn btn-48 btn-outline flex-1"
              >
                No
              </button>
            </div>
          </section>
        )}

        {skipped.length > 0 && (
          <section className="mt-6 rounded-[22px] bg-[var(--shelf)] px-5 py-4">
            <h2 className="t-data text-[var(--concrete)]">
              ROLLED ON TO THE NEXT LIST
            </h2>
            <ul className="mt-2">
              {skipped.map((item) => (
                <li key={item.id} className="t-list border-t border-black/10 py-2.5 first:border-0">
                  {byId.get(item.productId)?.name ?? item.productId}
                </li>
              ))}
            </ul>
          </section>
        )}

        {swaps.length > 0 && (
          <section className="mt-3 rounded-[22px] bg-[var(--shelf)] px-5 py-4">
            <h2 className="t-data text-[var(--concrete)]">SWAPS</h2>
            <ul className="mt-2">
              {swaps.map((item) => (
                <li key={item.id} className="t-list border-t border-black/10 py-2.5 first:border-0">
                  {byId.get(item.substitutedForId!)?.name} →{" "}
                  {byId.get(item.productId)?.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        <CoachMark id={COACH_MARKS.tripComplete} className="mt-6" />

        <Link href="/" className="btn btn-56 btn-ink mt-8 w-full">
          Back to your list
        </Link>
      </main>
    </AppShell>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[14px] bg-[var(--ripe-wash)] p-3">
      <p className="font-[family-name:var(--font-mono)] text-[20px] leading-none">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-[var(--concrete)]">{label}</p>
    </div>
  );
}
