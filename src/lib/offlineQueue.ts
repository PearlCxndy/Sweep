"use client";

import type { TripItemStatus } from "@/domain/types";

/**
 * Trip actions are applied optimistically and appended here. The trip itself
 * lives in localStorage too (see store.ts), so the shop's dead spots change
 * nothing about what the app can do — only when the queue drains.
 *
 * There is no server behind this case study, so `flush` clears the queue and
 * records when it drained. The shape is the part that matters: every action
 * carries the time it happened, not the time it was sent.
 */

const QUEUE_KEY = "sweep.queue";

export type QueuedAction = {
  id: string;
  at: string;
  tripId: string;
  itemId: string;
  kind: TripItemStatus;
  productId?: string;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or disabled store must not interrupt a shop.
  }
}

export function loadQueue(): QueuedAction[] {
  return read<QueuedAction[]>(QUEUE_KEY, []);
}

export function enqueue(
  action: Omit<QueuedAction, "id" | "at">,
): QueuedAction[] {
  const queued: QueuedAction = {
    ...action,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  };
  const next = [...loadQueue(), queued];
  write(QUEUE_KEY, next);
  return next;
}

export function flush(): QueuedAction[] {
  const pending = loadQueue();
  write(QUEUE_KEY, []);
  return pending;
}
