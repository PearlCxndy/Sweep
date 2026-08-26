"use client";

import { useCallback, useEffect, useRef } from "react";

import { FIRST_RUN_CARD } from "@/domain/onboarding";
import { useDeviceFlag } from "@/lib/hooks";

export const FIRST_RUN_CARD_KEY = "sweep:firstRunCardSeen";

/**
 * Shown once, on first open of the list, and never again. There is no setting
 * to bring it back and no re-show after an update.
 *
 * It states the one genuinely non-obvious thing about Sweep — that the
 * interface changes shape when you start shopping — and two facts that would
 * otherwise be a surprise: the list populates itself, and a locked item stays
 * locked. Everything else is self-evident and gets no instruction.
 *
 * One action. No skip: a three-line card does not need an escape hatch, and
 * offering one would say the content is optional filler.
 */
export function FirstRunCard() {
  const [seen, markSeen] = useDeviceFlag(FIRST_RUN_CARD_KEY);
  const actionRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (seen) return;
    // Remember where focus was, so closing puts it back on the list.
    returnFocusTo.current = document.activeElement as HTMLElement | null;
    actionRef.current?.focus();
  }, [seen]);

  const onDismiss = useCallback(() => {
    markSeen();
    returnFocusTo.current?.focus();
  }, [markSeen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Escape does the same thing the button does, so it is not an escape
      // hatch — it is the same single action, reachable from the keyboard.
      if (event.key === "Escape") onDismiss();
      // One focusable element, so the trap is simply: stay here.
      if (event.key === "Tab") {
        event.preventDefault();
        actionRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onDismiss, seen]);

  if (seen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3">
      <div className="sheet-scrim fade-in absolute inset-0" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-run-title"
        className="sheet-rise relative w-full max-w-[560px] rounded-[22px] bg-[var(--shelf)] px-5 py-6"
      >
        <h2 id="first-run-title" className="t-sheet-title">
          {FIRST_RUN_CARD.title}
        </h2>
        <p className="t-reason mt-1">{FIRST_RUN_CARD.standfirst}</p>

        <ol className="mt-6 flex flex-col gap-5">
          {FIRST_RUN_CARD.stages.map((stage) => (
            <li key={stage.number} className="flex items-start gap-3.5">
              {/* Mono numerals, not icons: the product has no decorative
                  imagery, and these tie to the receipt and price-ticket
                  language used everywhere else. */}
              <span className="plate bg-[var(--wash)] t-data text-[var(--concrete)]">
                {stage.number}
              </span>
              <span className="min-w-0">
                <span className="t-list block">{stage.title}</span>
                <span className="t-reason mt-1 block">{stage.line}</span>
              </span>
            </li>
          ))}
        </ol>

        <button
          ref={actionRef}
          type="button"
          onClick={onDismiss}
          className="btn btn-56 btn-ink mt-8 w-full"
        >
          {FIRST_RUN_CARD.action}
        </button>
      </div>
    </div>
  );
}
