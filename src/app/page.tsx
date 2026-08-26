"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AisleTreemap } from "@/components/AisleTreemap";
import { AppShell } from "@/components/AppShell";
import {
  CategoryMark,
  categoryMarkForSection,
  type CategoryMarkName,
} from "@/components/CategoryMark";
import { CoachMark } from "@/components/CoachMark";
import { FirstRunCard } from "@/components/FirstRunCard";
import { Mark } from "@/components/Mark";
import { SuggestionCard } from "@/components/SuggestionCard";
import { WeekStrip } from "@/components/WeekStrip";
import { groupByAisle } from "@/domain/storeOrder";
import { COACH_MARKS } from "@/domain/onboarding";
import {
  excludedByDeletedInferences,
  retiredByDismissals,
  suggestItems,
} from "@/domain/suggestions";
import { SECTION_WORD, storeLabel } from "@/domain/types";
import type { Product, Suggestion, TripItem } from "@/domain/types";
import {
  getInferences,
  getPlacements,
  getPreferenceMap,
  getProducts,
  getPurchases,
  getSponsored,
  getTrips,
} from "@/data/repositories";
import { useHydrated } from "@/lib/hooks";
import { useActiveStore, useSweep } from "@/lib/store";

const UNDO_WINDOW_MS = 5000;
const TYPICAL_SATURDAY = 14;

export default function YourList() {
  const store = useActiveStore();
  const catalogue = getProducts();
  const prefs = getPreferenceMap();

  const onboardingComplete = useSweep((s) => s.onboardingComplete);
  const profile = useSweep((s) => s.profile);
  const completedTrips = useSweep((s) => s.completedTrips);
  const listProductIds = useSweep((s) => s.listProductIds);
  const dismissed = useSweep((s) => s.dismissedSuggestions);
  const deletedInferenceIds = useSweep((s) => s.deletedInferenceIds);
  const dismissalCounts = useSweep((s) => s.dismissalCounts);
  const coachMarksSeen = useSweep((s) => s.coachMarksSeen);
  const seeCoachMark = useSweep((s) => s.seeCoachMark);
  const sponsoredEnabled = useSweep((s) => s.sponsoredEnabled);
  const addToList = useSweep((s) => s.addToList);
  const removeFromList = useSweep((s) => s.removeFromList);
  const dismissSuggestion = useSweep((s) => s.dismissSuggestion);
  const undoDismiss = useSweep((s) => s.undoDismiss);
  const startTrip = useSweep((s) => s.startTrip);
  const router = useRouter();

  const mounted = useHydrated();

  useEffect(() => {
    if (mounted && !onboardingComplete) router.replace("/onboarding");
  }, [mounted, onboardingComplete, router]);

  const [undoable, setUndoable] = useState<string[]>([]);
  const [justAdded, setJustAdded] = useState<string[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    const held = timers.current;
    return () => Object.values(held).forEach(clearTimeout);
  }, []);

  const byId = useMemo(
    () => new Map(catalogue.map((p) => [p.id, p])),
    [catalogue],
  );

  const suggestions = useMemo(() => {
    const silenced = excludedByDeletedInferences(
      getInferences(),
      deletedInferenceIds,
    );
    return suggestItems(getPurchases(), new Date(), {
      store,
      exclude: [
        ...listProductIds,
        ...dismissed,
        ...silenced,
        ...justAdded,
        // Turned down enough times to mean it, rather than just not today.
        ...retiredByDismissals(dismissalCounts),
      ],
    });
  }, [
    store,
    listProductIds,
    dismissed,
    deletedInferenceIds,
    justAdded,
    dismissalCounts,
  ]);

  const sponsored = useMemo(() => {
    if (!sponsoredEnabled) return null;
    const seed = getSponsored();
    if (listProductIds.includes(seed.productId)) return null;
    if (dismissed.includes(seed.productId)) return null;
    if (justAdded.includes(seed.productId)) return null;
    const product = byId.get(seed.productId);
    if (!product) return null;
    const suggestion: Suggestion = {
      productId: seed.productId,
      reason: seed.reason,
      confidence: "low",
      medianInterval: 0,
      daysSince: 0,
      overdueBy: 0,
      observations: 0,
    };
    return { product, suggestion };
  }, [sponsoredEnabled, listProductIds, dismissed, justAdded, byId]);

  const items: TripItem[] = useMemo(
    () =>
      listProductIds.map((productId) => ({
        id: `list-${productId}`,
        productId,
        quantity: 1,
        status: "pending" as const,
      })),
    [listProductIds],
  );

  const groups = useMemo(
    () =>
      groupByAisle(items, {
        store,
        placements: getPlacements(),
        catalogue,
      }),
    [items, store, catalogue],
  );

  const tripDates = useMemo(() => {
    const dates = new Set<string>();
    for (const trip of [...getTrips(), ...completedTrips]) {
      const date = (trip.completedAt ?? trip.startedAt ?? "").slice(0, 10);
      if (date) dates.add(date);
    }
    return dates;
  }, [completedTrips]);

  const categoryMarks = useMemo(() => {
    const seen = new Set<CategoryMarkName>();
    const marks: CategoryMarkName[] = [];
    for (const group of groups) {
      const mark = categoryMarkForSection(group.section);
      if (!mark || seen.has(mark)) continue;
      seen.add(mark);
      marks.push(mark);
    }
    return marks;
  }, [groups]);

  function hold(productId: string, bucket: "undoable" | "justAdded") {
    const set = bucket === "undoable" ? setUndoable : setJustAdded;
    set((ids) => [...ids, productId]);
    timers.current[productId] = setTimeout(() => {
      set((ids) => ids.filter((id) => id !== productId));
      delete timers.current[productId];
    }, UNDO_WINDOW_MS);
  }

  const [dismissedOnce, setDismissedOnce] = useState(false);

  function handleDismiss(productId: string) {
    dismissSuggestion(productId);
    setDismissedOnce(true);
    hold(productId, "undoable");
  }

  function handleAdd(productId: string) {
    addToList(productId);
    hold(productId, "justAdded");
  }

  function handleUndoDismiss(productId: string) {
    seeCoachMark(COACH_MARKS.dismissSuggestion);
    clearTimeout(timers.current[productId]);
    delete timers.current[productId];
    setUndoable((ids) => ids.filter((id) => id !== productId));
    undoDismiss(productId);
  }

  function handleUndoAdd(productId: string) {
    clearTimeout(timers.current[productId]);
    delete timers.current[productId];
    setJustAdded((ids) => ids.filter((id) => id !== productId));
    removeFromList(productId);
  }

  function beginShop() {
    startTrip(listProductIds.length > 8 ? "big" : "topup");
    router.push("/trip");
  }

  if (!mounted || !onboardingComplete) {
    return <div className="min-h-dvh bg-[var(--wash)]" />;
  }

  const ready = Math.min(
    100,
    Math.round((listProductIds.length / TYPICAL_SATURDAY) * 100),
  );
  const minutes = Math.max(listProductIds.length * 2, 0);

  const suggestionCards = (layout: "tile" | "row") => (
    <>
      {suggestions.map((s) => {
        const product = byId.get(s.productId);
        if (!product) return null;
        return (
          <SuggestionCard
            key={s.productId}
            suggestion={s}
            product={product}
            state={s.confidence === "low" ? "unsure" : "offered"}
            layout={layout}
            onAdd={() => handleAdd(s.productId)}
            onDismiss={() => handleDismiss(s.productId)}
            onUndo={() => handleUndoDismiss(s.productId)}
          />
        );
      })}
      {sponsored && (
        <SuggestionCard
          suggestion={sponsored.suggestion}
          product={sponsored.product}
          state="offered"
          sponsored
          layout={layout}
          onAdd={() => handleAdd(sponsored.product.id)}
          onDismiss={() => handleDismiss(sponsored.product.id)}
          onUndo={() => handleUndoDismiss(sponsored.product.id)}
        />
      )}
    </>
  );

  const dismissCoachOpen =
    dismissedOnce && !coachMarksSeen.includes(COACH_MARKS.dismissSuggestion);

  const feedback = (
    <>
      {justAdded.map((productId) => {
        const product = byId.get(productId);
        if (!product) return null;
        return (
          <SuggestionCard
            key={`added-${productId}`}
            suggestion={blankSuggestion(productId)}
            product={product}
            state="added"
            addedTo={SECTION_WORD[product.category]}
            onAdd={() => handleAdd(productId)}
            onDismiss={() => handleDismiss(productId)}
            onUndo={() => handleUndoAdd(productId)}
          />
        );
      })}
      {undoable.map((productId) => {
        const product = byId.get(productId);
        if (!product) return null;
        return (
          <SuggestionCard
            key={`dismissed-${productId}`}
            suggestion={blankSuggestion(productId)}
            product={product}
            state="dismissed"
            onAdd={() => handleAdd(productId)}
            onDismiss={() => handleDismiss(productId)}
            onUndo={() => handleUndoDismiss(productId)}
          />
        );
      })}
      {dismissCoachOpen && <CoachMark id={COACH_MARKS.dismissSuggestion} />}
    </>
  );

  const offeredCount = suggestions.length + (sponsored ? 1 : 0);

  const aside = (
    <>
      <div className="flex items-baseline justify-between">
        <h2 className="t-list">Suggested for you</h2>
        <span className="t-data text-[var(--concrete)]">{offeredCount}</span>
      </div>
      <div className="mt-4 flex flex-col gap-3.5">
        {suggestionCards("row")}
        {feedback}
        {offeredCount === 0 && justAdded.length === 0 && undoable.length === 0 && (
          <p className="t-reason">Nothing waiting.</p>
        )}
        <AddItem
          catalogue={catalogue}
          onAdd={handleAdd}
          alreadyOn={listProductIds}
        />
      </div>
    </>
  );

  return (
    <AppShell
      current="list"
      hideMobileChrome
      aside={aside}
      dock={
        <button
          type="button"
          onClick={beginShop}
          disabled={listProductIds.length === 0}
          className="btn btn-56 btn-ink w-full"
        >
          Start shopping
        </button>
      }
    >
      <main className="mx-auto min-h-dvh w-full max-w-[720px] px-5 pt-6 pb-8 lg:max-w-none lg:px-8 lg:pt-8 lg:pb-10">
        <header>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="t-item lg:text-[30px]">
                {profile?.displayName
                  ? `Hi, ${firstName(profile.displayName)}`
                  : "What are you shopping today?"}
              </h1>
              <p className="mt-1 text-[15px] text-[var(--concrete)]">
                {storeLabel(store)}
                <span className="hidden lg:inline">
                  {" "}
                  · {listProductIds.length} items across {groups.length} aisles
                  · about {minutes} min
                </span>
              </p>
            </div>
            <span className="shrink-0 overflow-hidden rounded-full lg:hidden">
              <Mark size={48} labelled />
            </span>
            <div className="hidden items-center gap-3.5 lg:flex">
              <ReadyRing value={ready} />
              <button
                type="button"
                onClick={beginShop}
                disabled={listProductIds.length === 0}
                className="btn btn-56 btn-ink px-6"
              >
                Start shopping
              </button>
            </div>
          </div>
          <div className="mt-5">
            <WeekStrip tripDates={tripDates} />
          </div>
        </header>

        <section
          className="mt-5 flex items-center justify-between rounded-[28px] bg-[var(--ink)] px-5 py-4 text-[var(--paper)] lg:hidden"
          aria-label={`${listProductIds.length} items, about ${minutes} minutes`}
        >
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-display)] text-[44px] leading-none font-semibold">
              {listProductIds.length}
            </span>
            <span className="flex items-center">
              {categoryMarks.map((mark, i) => (
                <span
                  key={mark}
                  className="overflow-hidden rounded-full ring-2 ring-[var(--ink)]"
                  style={{ marginLeft: i === 0 ? 0 : -10, zIndex: categoryMarks.length - i }}
                >
                  <CategoryMark
                    name={mark}
                    size={36}
                    className="!rounded-full !bg-[var(--paper)]"
                  />
                </span>
              ))}
            </span>
          </div>
          <ReadyRing value={ready} onInk />
        </section>

        <section className="mt-6" aria-labelledby="list-heading">
          <h2 id="list-heading" className="t-title">
            Your list
          </h2>

          {groups.length === 0 ? (
            <p className="t-reason mt-4">Nothing on the list yet.</p>
          ) : (
            <AisleTreemap
              groups={groups}
              byId={byId}
              prefs={prefs}
              onRemove={removeFromList}
            />
          )}

          <div className="lg:hidden">
            <AddItem
              catalogue={catalogue}
              onAdd={handleAdd}
              alreadyOn={listProductIds}
            />
          </div>
        </section>

        {(offeredCount > 0 ||
          justAdded.length > 0 ||
          undoable.length > 0 ||
          dismissCoachOpen) && (
          <section className="mt-6 lg:hidden" aria-labelledby="suggestions-heading">
            <div className="flex items-baseline justify-between">
              <h2 id="suggestions-heading" className="t-title">
                Suggested
              </h2>
              <span className="t-data text-[var(--concrete)]">{offeredCount}</span>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
              <div className="flex min-w-full gap-3 [&>*]:w-[min(220px,70vw)] [&>*]:shrink-0">
                {suggestionCards("tile")}
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">{feedback}</div>
          </section>
        )}
      </main>

      <FirstRunCard />
    </AppShell>
  );
}

function ReadyRing({ value, onInk = false }: { value: number; onInk?: boolean }) {
  const deg = Math.round((value / 100) * 360);
  const track = onInk ? "rgba(251,250,244,.18)" : "rgba(20,22,26,.1)";
  const hole = onInk ? "var(--ink)" : "var(--wash)";
  const ink = onInk ? "var(--paper)" : "var(--ink)";

  return (
    <div
      className="flex size-[62px] items-center justify-center rounded-full lg:size-[52px]"
      style={{
        background: `conic-gradient(var(--ripe) 0 ${deg}deg, ${track} ${deg}deg 360deg)`,
      }}
      aria-hidden
    >
      <div
        className="flex size-[44px] items-center justify-center rounded-full t-data lg:size-[38px]"
        style={{ background: hole, color: ink }}
      >
        {value}%
      </div>
    </div>
  );
}

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}


function blankSuggestion(productId: string): Suggestion {
  return {
    productId,
    reason: "",
    confidence: "low",
    medianInterval: 0,
    daysSince: 0,
    overdueBy: 0,
    observations: 0,
  };
}

function AddItem({
  catalogue,
  onAdd,
  alreadyOn,
}: {
  catalogue: Product[];
  onAdd: (id: string) => void;
  alreadyOn: string[];
}) {
  const [text, setText] = useState("");

  const matches = useMemo(() => {
    const q = normaliseSearch(text);
    if (!q) return [];
    return catalogue
      .filter((p) => productSearchText(p).includes(q))
      .sort((a, b) => {
        const aStarts = normaliseSearch(a.name).startsWith(q) ? 0 : 1;
        const bStarts = normaliseSearch(b.name).startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [text, catalogue]);

  return (
    <div className="mt-5">
      <label htmlFor="add-item" className="sr-only">
        Add an item
      </label>
      <input
        id="add-item"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add… (e.g. milk)"
        className="t-list h-12 w-full rounded-2xl border-[1.5px] border-dashed border-[var(--concrete)] bg-transparent px-3.5 placeholder:text-[var(--concrete)]"
      />
      {matches.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-[18px] bg-[var(--shelf)]">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  if (alreadyOn.includes(p.id)) return;
                  onAdd(p.id);
                  setText("");
                }}
                disabled={alreadyOn.includes(p.id)}
                className="t-list flex min-h-[44px] w-full items-center justify-between px-4 text-left disabled:cursor-default disabled:text-[var(--concrete)]"
              >
                <span>{p.name}</span>
                <span className="t-data text-[var(--concrete)]">
                  {alreadyOn.includes(p.id) ? "ON YOUR LIST" : p.size}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {text.trim() && matches.length === 0 && (
        <p className="t-reason mt-2" role="status">
          No matching product in this demo catalogue.
        </p>
      )}
    </div>
  );
}

function normaliseSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function productSearchText(product: Product): string {
  const seafood = /\b(fish|prawn|salmon|tuna)\b/i.test(product.name)
    ? " seafood"
    : "";
  return normaliseSearch(`${product.name} ${product.brand} ${product.size}${seafood}`);
}
