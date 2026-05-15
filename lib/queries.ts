import { prisma } from "./db";
import { DateTime } from "luxon";
import { TZ, WEEK_1_START, TOTAL_WEEKS } from "./dates";
import type { Prisma } from "@prisma/client";

export type DayFull = Prisma.DayGetPayload<{ include: { planned: true; logged: true } }>;

export async function getAllDays(): Promise<DayFull[]> {
  return prisma.day.findMany({
    orderBy: { date: "asc" },
    include: { planned: { orderBy: { order: "asc" } }, logged: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getDayByDate(isoDate: string): Promise<DayFull | null> {
  const dt = DateTime.fromISO(isoDate, { zone: TZ }).startOf("day").toJSDate();
  return prisma.day.findUnique({
    where: { date: dt },
    include: { planned: { orderBy: { order: "asc" } }, logged: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getAllStrengthLogs() {
  return prisma.loggedActivity.findMany({
    where: { setsJson: { not: undefined }, plannedActivity: { kind: "strength" } },
    include: { plannedActivity: true, day: true },
    orderBy: { day: { date: "asc" } },
  });
}

export async function getAllBodyMeasurements() {
  return prisma.bodyMeasurement.findMany({ orderBy: { date: "asc" } });
}

export function planSpan(): { start: DateTime; end: DateTime } {
  const start = DateTime.fromISO(WEEK_1_START, { zone: TZ }).startOf("day");
  return { start, end: start.plus({ weeks: TOTAL_WEEKS }).minus({ days: 1 }) };
}
