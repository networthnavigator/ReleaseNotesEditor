/**
 * Parse yyyy-mm-dd string to Date (local date, no time).
 * Returns null if invalid.
 */
export function parseYyyyMmDd(s: string | null | undefined): Date | null {
  if (s == null || typeof s !== 'string') return null;
  const trimmed = s.trim();
  if (trimmed === '') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);
  const date = new Date(y, m, d);
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
  return date;
}

/**
 * Format Date to yyyy-mm-dd for storage/API.
 */
export function toYyyyMmDd(date: Date | null | undefined): string {
  if (date == null || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
