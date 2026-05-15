import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";
import { buildPlan } from "../lib/plan";
import { TZ, WEEK_1_START, isoToDbDate } from "../lib/dates";

const prisma = new PrismaClient();

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    const deleted = await prisma.day.deleteMany({});
    console.log(`Reset: deleted ${deleted.count} existing Day rows (and cascaded children)`);
  }

  const plan = buildPlan();
  const week1 = DateTime.fromISO(WEEK_1_START, { zone: TZ }).startOf("day");

  let dayCount = 0;
  let activityCount = 0;

  for (const week of plan) {
    for (const day of week.days) {
      const date = week1.plus({ days: (week.weekNumber - 1) * 7 + (day.weekdayMonday1to7 - 1) });
      const dateJs = isoToDbDate(date.toISODate()!);

      // Upsert Day (preserves user data on re-seed)
      const dbDay = await prisma.day.upsert({
        where: { date: dateJs },
        update: {
          weekNumber: week.weekNumber,
          phase: week.phase,
          sessionType: day.sessionType,
        },
        create: {
          date: dateJs,
          weekNumber: week.weekNumber,
          phase: week.phase,
          sessionType: day.sessionType,
        },
      });
      dayCount++;

      // Wipe + recreate planned activities (they're plan-defined, not user data)
      await prisma.plannedActivity.deleteMany({ where: { dayId: dbDay.id } });
      if (day.activities.length > 0) {
        await prisma.plannedActivity.createMany({
          data: day.activities.map((a) => ({
            dayId: dbDay.id,
            order: a.order,
            kind: a.kind,
            label: a.label,
            targetValue: a.targetValue,
            targetUnit: a.targetUnit,
            targetSets: a.targetSets,
            targetRepsLow: a.targetRepsLow,
            targetRepsHigh: a.targetRepsHigh,
            perSide: a.perSide ?? false,
          })),
        });
        activityCount += day.activities.length;
      }
    }
  }

  console.log(`Seed complete: ${dayCount} days, ${activityCount} planned activities`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
