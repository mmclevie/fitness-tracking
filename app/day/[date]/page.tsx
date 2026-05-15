import { notFound } from "next/navigation";
import Link from "next/link";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getDayByDate } from "@/lib/queries";
import { computeDayStatus, statusDotColour } from "@/lib/status";
import { TZ, formatHuman } from "@/lib/dates";
import { LogRunRow } from "@/components/day/log-run-row";
import { LogSwimRow } from "@/components/day/log-swim-row";
import { LogStrengthRow } from "@/components/day/log-strength-row";
import { LogStructureRow } from "@/components/day/log-structure-row";
import { DayActions } from "@/components/day/day-actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SetEntry { reps: number; weightKg: number }

async function findLastStrengthSession(label: string, beforeDate: Date) {
  const log = await prisma.loggedActivity.findFirst({
    where: {
      plannedActivity: { label, kind: "strength" },
      setsJson: { not: undefined },
      day: { date: { lt: beforeDate } },
    },
    include: { day: true },
    orderBy: { day: { date: "desc" } },
  });
  if (!log || !log.setsJson) return null;
  return {
    sets: log.setsJson as unknown as SetEntry[],
    date: DateTime.fromJSDate(log.day.date, { zone: TZ }).toISODate()!,
  };
}

interface PageProps { params: Promise<{ date: string }> }

export default async function DayPage({ params }: PageProps) {
  const { date } = await params;
  const day = await getDayByDate(date);
  if (!day) notFound();

  const d = DateTime.fromISO(date, { zone: TZ }).startOf("day");
  const prev = d.minus({ days: 1 }).toISODate()!;
  const next = d.plus({ days: 1 }).toISODate()!;
  const { status, percent } = computeDayStatus(day);

  // Fetch last strength session for each strength exercise in parallel
  const lastSessions = await Promise.all(
    day.planned
      .filter((p) => p.kind === "strength")
      .map(async (p) => [p.label, await findLastStrengthSession(p.label, day.date)] as const)
  );
  const lastByLabel = new Map(lastSessions);

  const customLogs = day.logged.filter((l) => l.plannedActivityId === null);

  return (
    <div>
      <header className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/day/${prev}`}
            className="h-11 w-11 -ml-2 flex items-center justify-center text-muted-foreground active:text-foreground"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground active:text-foreground"
          >
            Calendar
          </Link>
          <Link
            href={`/day/${next}`}
            className="h-11 w-11 -mr-2 flex items-center justify-center text-muted-foreground active:text-foreground"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("h-3 w-3 rounded-full shrink-0", statusDotColour(status))} aria-hidden />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-tight truncate">{day.sessionType}</h1>
            <p className="text-sm text-muted-foreground">
              {formatHuman(d)} · Week {day.weekNumber} · {day.phase}
              {percent > 0 && status !== "blue" && ` · ${percent}%`}
            </p>
          </div>
        </div>
      </header>

      {day.planned.length > 0 ? (
        <section className="border-t border-border bg-card/20">
          {day.planned.map((p) => {
            const log = day.logged.find((l) => l.plannedActivityId === p.id) ?? null;
            if (p.kind === "run") return <LogRunRow key={p.id} date={date} planned={p} log={log} />;
            if (p.kind === "swim") return <LogSwimRow key={p.id} date={date} planned={p} log={log} />;
            if (p.kind === "strength")
              return (
                <LogStrengthRow
                  key={p.id}
                  date={date}
                  planned={p}
                  log={log}
                  lastSession={lastByLabel.get(p.label) ?? null}
                />
              );
            return <LogStructureRow key={p.id} date={date} planned={p} log={log} />;
          })}
        </section>
      ) : (
        <section className="px-4 py-6 border-t border-border text-sm text-muted-foreground">
          {day.sessionType === "Rest" ? "Rest day. Optional recovery swim allowed." : "No planned activities."}
        </section>
      )}

      <DayActions
        date={date}
        sessionType={day.sessionType}
        initialNotes={day.notes ?? ""}
        customLogs={customLogs as never}
      />
    </div>
  );
}
