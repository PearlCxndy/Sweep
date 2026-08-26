"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

/** How far the card has to travel before the release counts as a decision. */
const COMMIT = 88;
/** Movement below this is a tap, or the start of a scroll. Do not guess yet. */
const SLOP = 10;
/** Past the commit point the card keeps moving, but grudgingly. */
const RESIST = 0.32;

/**
 * Swipe as a shortcut, never as the only way through.
 *
 * The buttons underneath do not move or shrink when this is here. A shopper
 * with one hand on a trolley, in gloves, or holding a child, taps; a shopper
 * with a free thumb flicks. Both are first-class, and the swipe is discovered
 * rather than required — nothing is unreachable if it is never found.
 *
 * The axis is decided once per gesture and then held. A drag that starts
 * vertical is handed straight back to the browser to scroll with, because
 * fighting the scroller for an ambiguous gesture is how a list starts feeling
 * broken halfway down an aisle.
 */
export function SwipeStage({
  onRight,
  onLeft,
  rightLabel,
  leftLabel,
  disabled = false,
  children,
}: {
  onRight: () => void;
  onLeft: () => void;
  rightLabel: string;
  leftLabel: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const [settling, setSettling] = useState(false);

  const origin = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"unknown" | "x" | "y">("unknown");
  /** Buzzed once on crossing, so the thumb learns the threshold without looking. */
  const armed = useRef(false);

  function end() {
    origin.current = null;
    axis.current = "unknown";
    armed.current = false;
  }

  function release(committed: boolean) {
    if (committed) {
      // State commits now; the card snaps back for whatever arrives next.
      setDx(0);
      setSettling(false);
    } else {
      setSettling(true);
      setDx(0);
    }
    end();
  }

  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !e.isPrimary) return;
    origin.current = { x: e.clientX, y: e.clientY };
    axis.current = "unknown";
    armed.current = false;
    setSettling(false);
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const from = origin.current;
    if (!from) return;

    const moveX = e.clientX - from.x;
    const moveY = e.clientY - from.y;

    if (axis.current === "unknown") {
      if (Math.abs(moveX) < SLOP && Math.abs(moveY) < SLOP) return;
      axis.current = Math.abs(moveX) > Math.abs(moveY) ? "x" : "y";
      // A vertical drag belongs to the page, and we do not take it back.
      if (axis.current === "y") {
        end();
        return;
      }
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // A pointer that has already gone does not need capturing.
      }
    }

    const over = Math.abs(moveX) - COMMIT;
    const travel =
      over > 0 ? Math.sign(moveX) * (COMMIT + over * RESIST) : moveX;

    if (Math.abs(moveX) >= COMMIT && !armed.current) {
      armed.current = true;
      buzz();
    } else if (Math.abs(moveX) < COMMIT) {
      armed.current = false;
    }

    setDx(travel);
  }

  function up() {
    // A gesture the page took for scrolling never got here as a swipe.
    if (!origin.current && axis.current !== "x") {
      release(false);
      return;
    }

    const past = Math.abs(dx) >= COMMIT;
    const right = dx > 0;
    release(past);
    if (!past) return;

    // Fired after the reset so the handler measures the card where the thumb
    // left it — the falling copy starts from there, not from centre.
    if (right) onRight();
    else onLeft();
  }

  const progress = Math.min(Math.abs(dx) / COMMIT, 1);
  const committed = progress === 1;
  const right = dx > 0;

  return (
    <div className="swipe-stage">
      <div
        aria-hidden
        className={`swipe-reveal ${right ? "swipe-reveal-right" : "swipe-reveal-left"}`}
        style={{ opacity: dx === 0 ? 0 : 0.25 + progress * 0.75 }}
      >
        <span className={`t-data ${committed ? "swipe-armed" : ""}`}>
          {right ? rightLabel : leftLabel}
        </span>
      </div>

      <div
        className={`swipe-card ${settling ? "swipe-settling" : ""}`}
        style={{ transform: `translate3d(${dx}px, 0, 0)` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => release(false)}
        onTransitionEnd={() => setSettling(false)}
      >
        {children}
      </div>
    </div>
  );
}

/** Android honours it, iOS ignores it, neither breaks. */
function buzz() {
  try {
    navigator.vibrate?.(8);
  } catch {
    // A phone that will not buzz is not a reason to stop the gesture.
  }
}
