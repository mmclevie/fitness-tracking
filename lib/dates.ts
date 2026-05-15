import { DateTime } from "luxon";

export const TZ = "Australia/Perth";
export const WEEK_1_START = "2026-05-18";
export const RACE_DATE = "2026-10-11";
export const TOTAL_WEEKS = 21;

export function today(): DateTime {
  return DateTime.now().setZone(TZ).startOf("day");
}

export function fromISO(iso: string): DateTime {
  return DateTime.fromISO(iso, { zone: TZ }).startOf("day");
}

export function toISODate(d: DateTime | Date): string {
  if (d instanceof Date) {
    return DateTime.fromJSDate(d, { zone: TZ }).toISODate()!;
  }
  return d.setZone(TZ).toISODate()!;
}

export function dayOfWeekIndex(d: DateTime): number {
  // Luxon: 1 = Monday ... 7 = Sunday
  return d.weekday;
}

export function weekStart(d: DateTime): DateTime {
  return d.startOf("day").minus({ days: d.weekday - 1 });
}

export function planWeekNumber(d: DateTime): number | null {
  const start = fromISO(WEEK_1_START);
  const diff = Math.floor(d.diff(start, "days").days);
  if (diff < 0) return null;
  const week = Math.floor(diff / 7) + 1;
  if (week > TOTAL_WEEKS) return null;
  return week;
}

export function dayDateForWeek(week: number, weekdayMonday1to7: number): DateTime {
  const start = fromISO(WEEK_1_START);
  return start.plus({ days: (week - 1) * 7 + (weekdayMonday1to7 - 1) });
}

// Postgres @db.Date stores dates without timezone. To round-trip the intended
// Perth-local date through `Date` objects without it shifting by 8 hours and
// landing on the previous day, we encode/decode as UTC midnight.
export function isoToDbDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function dbDateToISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatHuman(d: DateTime | string): string {
  const dt = typeof d === "string" ? fromISO(d) : d;
  return dt.setZone(TZ).toFormat("EEE d LLL yyyy");
}

export function formatShortDay(d: DateTime): string {
  return d.setZone(TZ).toFormat("d");
}

export function formatWeekdayLetter(d: DateTime): string {
  // M T W T F S S
  const map = ["M", "T", "W", "T", "F", "S", "S"];
  return map[d.weekday - 1];
}

export function formatMonthHeader(d: DateTime): string {
  return d.setZone(TZ).toFormat("LLLL yyyy");
}
