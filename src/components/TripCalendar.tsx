"use client";

import type { Trip } from "@/domain/types";

/**
 * A month at a time. Big shop and top-up as different fills, a planned
 * trip as a dashed cell. Saturdays read as the pattern.
 */
export function TripCalendar({
  month,
  trips,
  plannedDate,
  selected,
  onSelect,
}: {
  month: Date;
  trips: Trip[];
  plannedDate?: string;
  selected?: string;
  onSelect: (date: string) => void;
}) {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;

  const prevMonth = new Date(Date.UTC(year, monthIndex, 0));
  const prevDays = prevMonth.getUTCDate();

  const byDate = new Map<string, Trip>();
  for (const trip of trips) {
    const date = (trip.completedAt ?? trip.startedAt ?? "").slice(0, 10);
    if (date) byDate.set(date, trip);
  }

  const trailing = (7 - ((leading + daysInMonth) % 7)) % 7;

  const cells: { day: number; inMonth: boolean; date: string }[] = [
    ...Array.from({ length: leading }, (_, i) => {
      const day = prevDays - leading + 1 + i;
      const d = new Date(Date.UTC(year, monthIndex - 1, day));
      return { day, inMonth: false, date: iso(d) };
    }),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
      return { day, inMonth: true, date };
    }),
    ...Array.from({ length: trailing }, (_, i) => {
      const day = i + 1;
      const d = new Date(Date.UTC(year, monthIndex + 1, day));
      return { day, inMonth: false, date: iso(d) };
    }),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="t-data pb-1 text-center text-[var(--concrete)]">
            {d}
          </div>
        ))}

        {cells.map(({ day, inMonth, date }) => {
          const trip = byDate.get(date);
          const planned = plannedDate === date;
          const isSelected = selected === date;

          let fill = "text-[var(--ink)]";
          if (!inMonth) fill = "text-[var(--ink)]/25";
          if (trip?.kind === "big") fill = "bg-[var(--ripe)] text-[var(--ink)]";
          else if (trip?.kind === "topup") fill = "bg-[var(--ripe-wash)] text-[var(--ink)]";
          else if (planned) fill = "border-[1.5px] border-dashed border-[var(--concrete)] text-[var(--ink)]";

          if (isSelected && trip) {
            fill = "bg-[var(--ink)] text-[var(--paper)]";
          }

          return (
            <button
              key={date}
              type="button"
              disabled={!trip}
              onClick={() => onSelect(date)}
              aria-label={
                trip
                  ? `${day}, ${trip.kind === "big" ? "big shop" : "top-up"}`
                  : `${day}, no shop`
              }
              aria-pressed={isSelected}
                  className={`press t-data flex min-h-[44px] items-center justify-center rounded-[13px] ${fill} ${
                !inMonth && !trip ? "text-[var(--ink)]/25" : ""
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
