import type { Prisma } from "@prisma/client";

export type StatusColour = "pending" | "grey" | "green" | "yellow" | "red" | "blue";

type DayWithRelations = Prisma.DayGetPayload<{
  include: { planned: true; logged: true };
}>;

interface SetEntry {
  reps: number;
  weightKg: number;
}

export function activityCompletionFraction(
  planned: DayWithRelations["planned"][number],
  logs: DayWithRelations["logged"]
): number {
  const relevant = logs.filter((l) => l.plannedActivityId === planned.id);
  if (relevant.length === 0) return 0;

  if (planned.kind === "run" || planned.kind === "swim") {
    const totalActualM = relevant.reduce((s, l) => s + (l.distanceM ?? 0), 0);
    if (planned.targetValue && planned.targetUnit) {
      const targetM = planned.targetUnit === "km"
        ? planned.targetValue * 1000
        : planned.targetUnit === "m"
          ? planned.targetValue
          : 0;
      if (targetM > 0) {
        return Math.min(totalActualM / targetM, 1);
      }
    }
    // No target distance — binary
    return 1;
  }

  if (planned.kind === "strength") {
    const setsTarget = planned.targetSets ?? 0;
    if (setsTarget === 0) return relevant.length > 0 ? 1 : 0;
    const setsLogged = relevant.reduce((s, l) => {
      const arr = (l.setsJson as unknown as SetEntry[] | null) ?? [];
      return s + arr.length;
    }, 0);
    return Math.min(setsLogged / setsTarget, 1);
  }

  // structure (warm-up/cool-down/strides) — binary
  return 1;
}

export function computeDayStatus(day: DayWithRelations): {
  status: StatusColour;
  percent: number;
} {
  const isRest = day.sessionType === "Rest";
  const isRaceDay = day.sessionType === "Race Day";
  const skipped = day.status === "red" && day.percentComplete === 0 && day.logged.length === 0;

  // If user explicitly skipped (we mark via percent=0 + status='red' + no logs), keep red
  if (skipped && !isRest) {
    return { status: "red", percent: 0 };
  }

  if (isRest) {
    // Rest day: blue once "marked complete" was pressed (we set percent=100). Otherwise pending.
    if (day.percentComplete >= 100) return { status: "blue", percent: 100 };
    return { status: "pending", percent: 0 };
  }

  if (day.planned.length === 0) {
    return day.logged.length > 0
      ? { status: "green", percent: 100 }
      : { status: "pending", percent: 0 };
  }

  const fractions = day.planned.map((p) => activityCompletionFraction(p, day.logged));
  const avg = fractions.reduce((s, f) => s + f, 0) / fractions.length;
  const percent = Math.round(avg * 100);

  let status: StatusColour;
  if (avg >= 0.9) status = "green";
  else if (avg >= 0.5) status = "yellow";
  else if (avg > 0) status = "red";
  else status = "pending";

  // Race day with any progress is celebrated as green
  if (isRaceDay && avg > 0.5) status = "green";

  return { status, percent };
}

export function statusDotColour(s: StatusColour): string {
  switch (s) {
    case "green": return "bg-status-green";
    case "yellow": return "bg-status-yellow";
    case "red": return "bg-status-red";
    case "blue": return "bg-status-blue";
    case "grey":
    case "pending":
    default:
      return "bg-status-grey";
  }
}
