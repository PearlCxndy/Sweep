"use client";

import Link from "next/link";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * This week's days, journal-style. Any tap opens Past trips for that date.
 */
export function WeekStrip({ tripDates }: { tripDates: ReadonlySet<string> }) {
  const days = weekDays(new Date());
  const today = isoLocal(new Date());

  return (
    <nav
      aria-label="This week. Opens past trips."
      className="flex justify-between gap-1"
    >
      {days.map((date, i) => {
        const iso = isoLocal(date);
        const isToday = iso === today;
        const hadTrip = tripDates.has(iso);

        return (
          <Link
            key={iso}
            href={`/trips?date=${iso}`}
            className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center gap-1.5"
            aria-label={
              hadTrip
                ? `${DAY_LABELS[i]} ${date.getDate()}, shop recorded. Open past trips.`
                : `${DAY_LABELS[i]} ${date.getDate()}. Open past trips.`
            }
            aria-current={isToday ? "date" : undefined}
          >
            <span className="text-[12px] text-[var(--concrete)]">
              {DAY_LABELS[i]}
            </span>
            <span
              className={`flex size-10 items-center justify-center rounded-full text-[15px] font-medium ${
                isToday
                  ? "bg-[var(--ripe)] text-[var(--ink)]"
                  : "bg-[var(--shelf)] text-[var(--ink)]"
              }`}
            >
              {date.getDate()}
            </span>
            <span
              className={`size-1.5 rounded-full ${
                hadTrip ? "bg-[var(--ink)]" : "bg-transparent"
              }`}
              aria-hidden
            />
          </Link>
        );
      })}
    </nav>
  );
}

function weekDays(from: Date): Date[] {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
