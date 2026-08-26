"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AisleMarker } from "@/components/AisleMarker";
import { ItemStage } from "@/components/ItemStage";
import { CoachMark } from "@/components/CoachMark";
import { LockedItemPanel } from "@/components/LockedItemPanel";
import { ProgressHairline } from "@/components/ProgressHairline";
import { RouteRail } from "@/components/RouteRail";
import { SubstituteTicket } from "@/components/SubstituteTicket";
import { routeStops } from "@/domain/route";
import { placementFor } from "@/domain/storeOrder";
import { SECTION_WORD } from "@/domain/types";
import { COACH_MARKS } from "@/domain/onboarding";
import { substitutesFor } from "@/domain/substitutions";
import { ProductMark } from "@/components/ProductMark";
import { SwipeStage } from "@/components/SwipeStage";
import { basket } from "@/domain/basket";
import type { Product, TripItem } from "@/domain/types";
import {
  getPlacements,
  getPreferenceMap,
  getPriorSubstitutions,
  getProducts,
  getPurchases,
  isOutOfStock,
} from "@/data/repositories";
import { money } from "@/lib/format";
import { useHydrated, useOnline } from "@/lib/hooks";
import { useActiveStore, useSweep } from "@/lib/store";

export default function TripMode() {
  const router = useRouter();
  const store = useActiveStore();
  const catalogue = getProducts();
  const placements = getPlacements();

  const trip = useSweep((s) => s.trip);
  const setStatus = useSweep((s) => s.setStatus);
  const substitute = useSweep((s) => s.substitute);
  const startFromStop = useSweep((s) => s.startFromStop);
  const usualBrand = useSweep((s) => s.usualBrand);
  const coachMarksSeen = useSweep((s) => s.coachMarksSeen);
  const seeCoachMark = useSweep((s) => s.seeCoachMark);

  const mounted = useHydrated();
  const online = useOnline();

  /**
   * The item on screen, when it is not simply the next one on the route.
   *
   * Two things set it. Resolving a gap on the shelf holds the item there while
   * the swap is chosen, and tapping a line in the route rail pulls it forward
   * because the shopper is standing in front of it. Both are the same idea —
   * the screen follows the shopper, not the sort order — so they are one piece
   * of state, cleared the moment the item is settled.
   */
  const [focusId, setFocusId] = useState<string | null>(null);

  /** A copy of the mark that just left, falling. See `.drop-layer`. */
  const markRef = useRef<HTMLDivElement | null>(null);
  const [drop, setDrop] = useState<{
    product: Product;
    box: { left: number; top: number; width: number; height: number };
  } | null>(null);

  const byId = useMemo(
    () => new Map(catalogue.map((p) => [p.id, p])),
    [catalogue],
  );

  const prefs = useMemo(() => {
    const base = getPreferenceMap();
    const merged = { ...base };
    for (const [productId, brandProductId] of Object.entries(usualBrand)) {
      const brand = catalogue.find((p) => p.id === brandProductId)?.brand;
      if (!brand) continue;
      merged[productId] = {
        ...(merged[productId] ?? { productId, neverSubstitute: false }),
        preferredBrand: brand,
      };
    }
    return merged;
  }, [usualBrand, catalogue]);

  const original = useMemo(
    () => trip?.items.filter((i) => !i.substitutedForId) ?? [],
    [trip],
  );
  const done = original.filter(
    (i) => i.status !== "pending" && i.status !== "not_here",
  ).length;

  /**
   * The number a shopper actually wants halfway round: what the trolley has
   * cost so far. Catalogue prices, not till prices, so it is labelled as a
   * running figure and never as a bill.
   */
  const spend = useMemo(
    () => basket(trip?.items ?? [], catalogue),
    [trip, catalogue],
  );

  const pending = trip?.items.find((i) => i.status === "pending") ?? null;
  const focused = focusId
    ? (trip?.items.find((i) => i.id === focusId) ?? null)
    : null;
  const current: TripItem | null = focused ?? pending;

  const leaving = useRef(false);

  useEffect(() => {
    if (!mounted || leaving.current) return;
    if (!trip) {
      leaving.current = true;
      router.replace("/");
    } else if (!current) {
      leaving.current = true;
      router.replace("/trip/done");
    }
  }, [mounted, trip, current, router]);

  if (!mounted || !trip || !current) {
    return <div className="ink-ground min-h-dvh" />;
  }

  const product = byId.get(current.productId);
  if (!product) return <div className="ink-ground min-h-dvh" />;

  const placement = placementFor(product.id, { store, placements });
  const nextItem = trip.items.find(
    (i) => i.status === "pending" && i.id !== current.id,
  );
  const next = nextItem ? byId.get(nextItem.productId) : undefined;

  const preference = prefs[product.id];
  const alternatives = substitutesFor(product, {
    catalogue,
    prefs,
    purchases: getPurchases(),
    priorSubstitutions: getPriorSubstitutions(),
  });

  /**
   * Acting on the item is acknowledgement enough. A coach mark that has done
   * its job should not still be sitting there waiting to be tapped.
   */
  function acknowledge() {
    seeCoachMark(COACH_MARKS.tripMode);
    if (showNotHereHint) seeCoachMark(COACH_MARKS.notHere);
    if (preference?.neverSubstitute) seeCoachMark(COACH_MARKS.lockedItem);
  }

  function markNotHere() {
    acknowledge();
    setStatus(current!.id, "not_here");
    setFocusId(current!.id);
  }

  function chooseSubstitute(replacementId: string) {
    acknowledge();
    substitute(current!.id, replacementId);
    setFocusId(null);
  }

  function skip() {
    acknowledge();
    setStatus(current!.id, "skipped");
    setFocusId(null);
  }

  function inTrolley() {
    acknowledge();

    // Measured before the state change, because the next item takes this space
    // immediately. The fall is a copy, on its own layer, holding nothing up.
    const box = markRef.current?.getBoundingClientRect();
    if (box && product) {
      setDrop({
        product,
        box: {
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
        },
      });
    }

    setStatus(current!.id, "in_trolley");
    setFocusId(null);
  }

  function goBack() {
    acknowledge();
    setStatus(current!.id, "pending");
    setFocusId(null);
  }

  /** Taking something the route has not reached yet, or reopening a done line. */
  function jumpTo(itemId: string) {
    setFocusId(itemId === pending?.id ? null : itemId);
  }

  /**
   * "I'm in aisle 6." Rotates the whole walk to begin there.
   *
   * Any jump is dropped at the same time: once the route admits where the
   * shopper is standing, nothing is out of order any more.
   */
  function startHere(order: number | null) {
    startFromStop(order);
    setFocusId(null);
  }

  /** Wrong thing in the trolley. Puts the line back on the list, unsettled. */
  function takeBackOut() {
    setStatus(current!.id, "pending");
    setFocusId(null);
  }

  const inSubState = current.status === "not_here";
  const settled = current.status !== "pending" && !inSubState;
  const alreadyIn = current.status === "in_trolley";
  const offRoute =
    !inSubState && pending !== null && current.id !== pending.id;
  const isLocked = inSubState && preference?.neverSubstitute === true;
  const paper = inSubState;

  /**
   * The one mark that pre-empts rather than follows: it wants to be read
   * before the shopper is standing at a gap on the shelf, not after.
   *
   * The seeded stock flag is what stages that moment here. Sweep has no stock
   * feed and never claims one — in production this would need a different
   * trigger, because only the shopper can see the shelf.
   */
  const stops = routeStops(trip.items, current.id, {
    store,
    placements,
    catalogue,
    startAisleOrder: trip.startFrom,
  });

  const showNotHereHint =
    !inSubState &&
    isOutOfStock(product.id) &&
    coachMarksSeen.includes(COACH_MARKS.tripMode);

  /** Offered once the buttons have done a lap, and never over the hint above. */
  const showSwipeHint =
    !inSubState &&
    !showNotHereHint &&
    done >= 1 &&
    coachMarksSeen.includes(COACH_MARKS.tripMode);

  return (
    <main
      className={`${
        paper ? "bg-[var(--paper)] text-[var(--ink)]" : "ink-ground"
      } trip-layout px-5 pt-6 pb-5`}
    >
      <header>
        {paper ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={goBack}
              className="plate border-[1.5px] border-[var(--concrete)] t-data text-[var(--concrete)]"
              aria-label="Back to this item"
            >
              ←
            </button>
            <p className="t-data text-[var(--concrete)]">
              {isLocked ? "NEVER SUBSTITUTE" : "NOT HERE"}
              {placement ? ` · AISLE ${placement.aisle}` : ""}
            </p>
          </div>
        ) : (
          <>
            <div className="t-data flex items-center justify-between text-[var(--concrete)]">
              <span className="flex items-center gap-2">
                <span
                  className={`size-1.5 rounded-full ${
                    online ? "bg-[var(--concrete)]" : "bg-[var(--ripe)]"
                  }`}
                />
                {online ? "ONLINE" : "OFFLINE"}
              </span>
              <span className="flex items-center gap-2.5">
                <span
                  key={spend.inTrolley}
                  className="split-flap inline-block text-[var(--paper)]"
                >
                  {money(spend.inTrolley)}
                  {spend.unpriced > 0 ? "+" : ""}
                </span>
                <span aria-hidden className="opacity-40">
                  ·
                </span>
                <span>
                  {done} OF {original.length}
                </span>
              </span>
            </div>
            <div className="mt-3">
              <ProgressHairline
                done={done}
                total={original.length}
                landing={drop !== null}
              />
            </div>
            <div className="mt-3">
              <RouteRail
                stops={stops}
                currentItemId={current.id}
                onJump={jumpTo}
                onStartHere={startHere}
                rotated={trip.startFrom !== undefined}
                spend={spend}
              />
            </div>
          </>
        )}
      </header>

      <div className="trip-body mt-5">
        <div className="trip-stage">
          {isLocked ? (
            <LockedItemPanel
              product={product}
              preference={preference}
              onInTrolley={inTrolley}
              onSkip={skip}
            />
          ) : inSubState ? (
            <NotHere
              productName={product.name}
              alternatives={alternatives}
              onChoose={chooseSubstitute}
              onSkip={skip}
            />
          ) : (
            <div key={current.id} className="stage-in flex grow flex-col">
              <AisleMarker
                aisle={placement?.aisle ?? null}
                section={placement?.section ?? SECTION_WORD[product.category]}
              />
              {(offRoute || settled) && (
                <button
                  type="button"
                  onClick={() => setFocusId(null)}
                  className="press t-data mt-3 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-white/8 px-3 text-left text-[var(--concrete)]"
                >
                  <span>{settled ? SETTLED_WORD[current.status] : "OUT OF ORDER"}</span>
                  <span className="text-[var(--ripe)]">BACK TO THE ROUTE →</span>
                </button>
              )}
              <SwipeStage
                onRight={alreadyIn ? takeBackOut : inTrolley}
                onLeft={alreadyIn ? () => setFocusId(null) : markNotHere}
                rightLabel={alreadyIn ? "TAKE IT BACK OUT" : "IN THE TROLLEY"}
                leftLabel={alreadyIn ? "LEAVE IT IN" : "NOT HERE"}
              >
                <ItemStage
                  product={product}
                  usualBrand={prefs[product.id]?.preferredBrand}
                  quantity={current.quantity}
                  next={offRoute ? undefined : next}
                  markRef={markRef}
                />
              </SwipeStage>
            </div>
          )}
        </div>

        {!isLocked && !inSubState && (
          <div className="trip-actions mt-4">
            {/* Already in the trolley: the only useful action left is undoing
                it, so that is the one the thumb lands on. */}
            <button
              type="button"
              onClick={alreadyIn ? takeBackOut : inTrolley}
              className={`btn btn-56 w-full ${
                alreadyIn ? "btn-ghost" : "btn-ripe"
              }`}
            >
              {alreadyIn ? "Take it back out" : "In the trolley"}
            </button>
            <button
              type="button"
              onClick={alreadyIn ? () => setFocusId(null) : markNotHere}
              className={`btn btn-48 w-full ${
                alreadyIn ? "text-[var(--concrete)]" : "btn-ghost"
              }`}
            >
              {alreadyIn ? "Leave it in" : "Not here"}
            </button>
          </div>
        )}
      </div>

      {drop && (
        <div
          aria-hidden
          className="drop-layer"
          style={{
            left: drop.box.left,
            top: drop.box.top,
            width: drop.box.width,
            height: drop.box.height,
          }}
        >
          <span onAnimationEnd={() => setDrop(null)}>
            <ProductMark
              product={drop.product}
              size={128}
              className="!rounded-[22px]"
            />
          </span>
        </div>
      )}

      {isLocked && <CoachMark id={COACH_MARKS.lockedItem} className="mt-4" />}

      {!inSubState && (
        <>
          {/* Let them see the screen before it is explained. */}
          <CoachMark id={COACH_MARKS.tripMode} delayMs={800} className="mt-4" />
          {showNotHereHint && (
            <CoachMark id={COACH_MARKS.notHere} className="mt-4" />
          )}
          {showSwipeHint && <CoachMark id={COACH_MARKS.swipe} className="mt-4" />}
        </>
      )}

      {/* Scaffolding for the walkthrough, and only once the coach mark that
          says the same thing has been read. */}
      {isOutOfStock(product.id) &&
        !inSubState &&
        coachMarksSeen.includes(COACH_MARKS.notHere) && (
          <p className="t-data mt-4 opacity-40">SEEDED DEMO · TRY NOT HERE</p>
        )}
    </main>
  );
}

function NotHere({
  productName,
  alternatives,
  onChoose,
  onSkip,
}: {
  productName: string;
  alternatives: ReturnType<typeof substitutesFor>;
  onChoose: (productId: string) => void;
  onSkip: () => void;
}) {
  const recommended = alternatives.find((a) => a.recommended);

  return (
    <div className="flex h-full flex-col">
      <h1 className="t-title mt-4 max-w-[20ch] text-[24px] leading-tight">
        No {productName} on the shelf.
        {alternatives.length > 0
          ? ` ${alternatives.length === 1 ? "One way" : `${alternatives.length} ways`} round it.`
          : " Nothing close enough."}
      </h1>

      <div className="mt-5 flex flex-col gap-3">
        {alternatives.map((ranked) => (
          <SubstituteTicket
            key={ranked.product.id}
            ranked={ranked}
            onChoose={() => onChoose(ranked.product.id)}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        {recommended && (
          <button
            type="button"
            onClick={() => onChoose(recommended.product.id)}
            className="btn btn-56 btn-ink w-full"
          >
            Take {shortSwap(recommended.product.name)}
          </button>
        )}
        <button type="button" onClick={onSkip} className="btn btn-48 w-full text-[var(--concrete)]">
          Skip this item
        </button>
      </div>
    </div>
  );
}

/** What the banner says when the shopper reopens a line they already settled. */
const SETTLED_WORD: Record<string, string> = {
  in_trolley: "ALREADY IN THE TROLLEY",
  skipped: "SKIPPED EARLIER",
  substituted: "SWAPPED EARLIER",
};

function shortSwap(name: string): string {
  return name.replace(/^Tesco\s+/i, "").replace(/^Arla\s+/i, "");
}
