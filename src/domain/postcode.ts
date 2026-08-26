/**
 * UK postcodes are typed every which way: "E140TB", "e14 0tb", "E14  0TB".
 * Search has to treat those as the same place.
 */
export function normaliseUkPostcode(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
  if (!match) return compact;
  return `${match[1]} ${match[2]}`;
}

export function outwardCode(raw: string): string {
  return normaliseUkPostcode(raw).split(" ")[0] ?? "";
}
