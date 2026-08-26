"use client";

import { useCallback, useSyncExternalStore } from "react";
import { flush } from "./offlineQueue";

const noopSubscribe = () => () => {};

/**
 * False during the server render and the first client render, true after.
 * The trip and the list are restored from localStorage, so the first paint
 * cannot know them; this keeps that honest instead of guessing and correcting.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function subscribeToConnection(onChange: () => void): () => void {
  const goOnline = () => {
    // Drain whatever was queued while the shop's signal was gone.
    flush();
    onChange();
  };
  window.addEventListener("online", goOnline);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", goOnline);
    window.removeEventListener("offline", onChange);
  };
}

/** Assumed online on the server, where there is nothing to report. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeToConnection,
    () => navigator.onLine,
    () => true,
  );
}

/**
 * A one-way device flag in localStorage.
 *
 * Device state, not account state: the first-run card should not survive a
 * sync conflict or block on a network call, and a shopper on a second device
 * has not seen it there. Coach mark flags live in the synced profile; this one
 * deliberately does not.
 */
const flagListeners = new Set<() => void>();

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    // A disabled store means we cannot know it was seen. Treating that as
    // "seen" is the quieter failure: better a missed card than a card that
    // returns on every load having promised it would not.
    return true;
  }
}

export function useDeviceFlag(key: string): [boolean, () => void] {
  const value = useSyncExternalStore(
    (onChange) => {
      flagListeners.add(onChange);
      return () => flagListeners.delete(onChange);
    },
    () => readFlag(key),
    () => true,
  );

  const set = useCallback(() => {
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      // Nothing to do. The card closes either way.
    }
    flagListeners.forEach((listener) => listener());
  }, [key]);

  return [value, set];
}
