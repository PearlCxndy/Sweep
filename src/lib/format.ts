/** Pence to pounds, always two decimals: prices are data, not prose. */
export function money(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function elapsed(fromIso: string, toIso: string): string {
  const mins = Math.max(
    0,
    Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60_000),
  );
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
