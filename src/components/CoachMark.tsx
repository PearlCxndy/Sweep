"use client";

import { useEffect, useState } from "react";

import { COACH_MARK_COPY } from "@/domain/onboarding";
import type { CoachMarkId } from "@/domain/onboarding";
import { useSweep } from "@/lib/store";

/**
 * One line, at the moment it becomes useful, once ever.
 *
 * Mounting this component *is* the trigger — the screen decides when the
 * interaction has become relevant. It renders nothing once its id has been
 * seen, so a screen can mount it unconditionally.
 *
 * It sits in the flow at the bottom of the screen rather than floating over
 * it. That is what "never blocks" has to mean in practice: a sheet pinned over
 * the primary action would cover the button it is describing.
 */
export function CoachMark({
  id,
  delayMs = 0,
  className = "",
}: {
  id: CoachMarkId;
  /** Let the shopper see the screen before it is explained. */
  delayMs?: number;
  /** Spacing is the call site's business: some slots already have a gap. */
  className?: string;
}) {
  const seen = useSweep((s) => s.coachMarksSeen);
  const seeCoachMark = useSweep((s) => s.seeCoachMark);
  const [ready, setReady] = useState(delayMs === 0);

  const alreadySeen = seen.includes(id);

  useEffect(() => {
    if (delayMs === 0 || alreadySeen) return;
    const timer = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, alreadySeen]);

  if (alreadySeen || !ready) return null;

  const copy = COACH_MARK_COPY[id];

  return (
    <aside
      className={`sheet-rise rounded-[22px] bg-[var(--shelf)] px-4 py-3.5 text-[var(--ink)] ${className}`}
      aria-live="polite"
    >
      <p className="t-data text-[var(--wayfind)]">FIRST TIME ONLY</p>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <p className="t-list min-w-0">{copy.line}</p>
        <button
          type="button"
          onClick={() => seeCoachMark(id)}
          className="btn btn-48 btn-outline shrink-0 px-4"
        >
          {copy.dismiss}
        </button>
      </div>
    </aside>
  );
}
