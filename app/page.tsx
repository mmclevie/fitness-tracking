import { DateTime } from "luxon";
import { getAllDays, planSpan, type DayFull } from "@/lib/queries";
import { computeDayStatus, type StatusColour } from "@/lib/status";
import { TZ, today } from "@/lib/dates";
import { DayRow } from "@/components/calendar/day-row";
import { WeekSummary } from "@/components/calendar/week-summary";
import { TodayFab } from "@/components/calendar/today-fab";

export const dynamic = "force-dynamic";

function sessionLabelFor(day: DayFull): string {
  if (day.planned.length === 0) {
    if (day.sessionType === "Rest") return "Optional recovery swim";
    if (day.sessionType === "Race Day") return "21.1km";
    return "";
  }
  // For strength sessions, show exercise count
  if (day.sessionType.startsWith("Strength")) {
    return `${day.planned.length} exercises`;
  }
  // For runs/swims, show primary activity label
  const main = day.planned.find((p) => p.kind === "run" || p.kind === "swim") ?? day.planned[0];
  return main.label;
}

function plannedRunKm(day: DayFull): number {
  return day.planned
    .filter((p) => (p.kind === "run" || p.kind === "structure") && p.targetUnit === "km")
    .reduce((s, p) => s + (p.targetValue ?? 0), 0);
}

function loggedRunKm(day: DayFull): number {
  let m = 0;
  for (const l of day.logged) {
    if (l.plannedActivityId) {
      const pa = day.planned.find((p) => p.id === l.plannedActivityId);
      if (pa && (pa.kind === "run" || pa.kind === "structure")) m += l.distanceM ?? 0;
    }
  }
  return m / 1000;
}

export default async function CalendarPage() {
  const days = await getAllDays();
  const nowDt = today();
  const todayIso = nowDt.toISODate()!;
  const { start, end } = planSpan();

  // Build full list of dates from plan start (or earlier if "today" is before)
  const renderStart = nowDt < start ? nowDt.startOf("week") : start.startOf("week");
  const renderEnd = end.endOf("week");

  // Group days by ISO week (Monday-start)
  const byDate = new Map(days.map((d) => [DateTime.fromJSDate(d.date, { zone: TZ }).toISODate()!, d]));

  type WeekGroup = { weekNumber: number | null; phase: string; dates: DateTime[] };
  const groups: WeekGroup[] = [];

  let cursor = renderStart;
  while (cursor <= renderEnd) {
    const weekDates: DateTime[] = [];
    for (let i = 0; i < 7; i++) {
      weekDates.push(cursor.plus({ days: i }));
    }
    const firstDay = byDate.get(weekDates[0].toISODate()!);
    const weekNumber = firstDay?.weekNumber ?? null;
    const phase = firstDay?.phase ?? "";
    groups.push({ weekNumber, phase, dates: weekDates });
    cursor = cursor.plus({ weeks: 1 });
  }

  return (
    <div className="pb-8">
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">Half marathon</h1>
        <p className="text-sm text-muted-foreground">
          Race day · Sun 11 Oct 2026 · {Math.max(0, Math.ceil(end.diff(nowDt, "days").days))} days to go
        </p>
      </header>

      <div>
        {groups.map((g, gi) => {
          const weekDays = g.dates.map((d) => byDate.get(d.toISODate()!));
          const plannedKm = weekDays.reduce((s, d) => s + (d ? plannedRunKm(d) : 0), 0);
          const loggedKm = weekDays.reduce((s, d) => s + (d ? loggedRunKm(d) : 0), 0);
          const planned = weekDays.filter((d) => d && d.planned.length > 0 && d.sessionType !== "Rest").length;
          const completed = weekDays.filter((d) => {
            if (!d) return false;
            const { status } = computeDayStatus(d);
            return status === "green" || status === "yellow";
          }).length;

          return (
            <section key={gi}>
              {g.weekNumber !== null && (
                <WeekSummary
                  weekNumber={g.weekNumber}
                  phaseLabel={g.phase}
                  plannedKm={plannedKm}
                  loggedKm={loggedKm}
                  sessionsPlanned={planned}
                  sessionsCompleted={completed}
                />
              )}
              {g.dates.map((d) => {
                const iso = d.toISODate()!;
                const dbDay = byDate.get(iso);
                let status: StatusColour = "grey";
                let sessionType = "—";
                let label = "Before plan";
                if (dbDay) {
                  const { status: s } = computeDayStatus(dbDay);
                  status = s === "pending" && d < nowDt ? "red" : s;
                  sessionType = dbDay.sessionType;
                  label = sessionLabelFor(dbDay);
                }
                return (
                  <DayRow
                    key={iso}
                    date={d}
                    sessionType={sessionType}
                    sessionLabel={label}
                    status={status}
                    isToday={iso === todayIso}
                    isInPlan={!!dbDay}
                  />
                );
              })}
            </section>
          );
        })}
      </div>

      <TodayFab todayIso={todayIso} />
    </div>
  );
}
