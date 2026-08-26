/**
 * Oversized numeral, readable at arm's length. On ink ground it sits on a
 * ripe plate so the number stays ink-on-lime at 60cm. Flips like a
 * departure board when the aisle changes — one beat, no bounce.
 */
export function AisleMarker({
  aisle,
  section,
}: {
  aisle: number | null;
  section: string;
}) {
  const flipKey = `${aisle ?? "x"}-${section}`;

  if (aisle === null) {
    return (
      <div
        className="flex items-baseline gap-3 rounded-[22px] bg-[var(--ripe)] px-5 py-4 text-[var(--ink)]"
        aria-live="polite"
      >
        <span key={flipKey} className="split-flap t-item">
          {section}
        </span>
        <span className="t-data opacity-60">NO AISLE DATA</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-baseline gap-3.5 rounded-[22px] bg-[var(--ripe)] px-5 py-4 text-[var(--ink)]"
      aria-live="polite"
    >
      <span key={flipKey} className="split-flap t-aisle">
        {aisle}
      </span>
      <div>
        <p className="t-title">{section}</p>
        <p className="t-data mt-1 opacity-60">AISLE {aisle}</p>
      </div>
    </div>
  );
}
