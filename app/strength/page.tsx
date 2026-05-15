import { prisma } from "@/lib/db";
import { dbDateToISO } from "@/lib/dates";
import { StrengthChart, type StrengthPoint } from "@/components/charts/strength-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface SetEntry { reps: number; weightKg: number }

interface ExerciseHistory {
  label: string;
  targetRepsHigh: number | null;
  perSide: boolean;
  points: StrengthPoint[];
  sessions: { date: string; sets: SetEntry[] }[];
}

function suggestNextStep(ex: ExerciseHistory): string | null {
  if (ex.sessions.length < 2 || ex.targetRepsHigh == null) return null;
  const recent = ex.sessions.slice(-2);
  const allTopOfRange = recent.every(
    (s) => s.sets.length > 0 && s.sets.every((set) => set.reps >= (ex.targetRepsHigh ?? 0))
  );
  if (!allTopOfRange) return null;
  const topW = Math.max(...recent[recent.length - 1].sets.map((s) => s.weightKg));
  return `Hit top of range two sessions in a row. Try ${(topW + 2.5).toFixed(1)}kg next session.`;
}

export default async function StrengthPage() {
  const logs = await prisma.loggedActivity.findMany({
    where: {
      setsJson: { not: undefined },
      plannedActivity: { kind: "strength" },
    },
    include: { plannedActivity: true, day: true },
    orderBy: { day: { date: "asc" } },
  });

  const byLabel = new Map<string, ExerciseHistory>();
  for (const l of logs) {
    if (!l.plannedActivity) continue;
    const label = l.plannedActivity.label;
    const sets = (l.setsJson as unknown as SetEntry[]) ?? [];
    if (sets.length === 0) continue;
    const dateISO = dbDateToISO(l.day.date);
    const topSetKg = Math.max(...sets.map((s) => s.weightKg));
    const avgKg = sets.reduce((a, s) => a + s.weightKg, 0) / sets.length;
    const topReps = Math.max(...sets.map((s) => s.reps));
    const existing = byLabel.get(label);
    const point: StrengthPoint = { date: dateISO, topSetKg, avgKg: Math.round(avgKg * 10) / 10, topReps };
    if (existing) {
      existing.points.push(point);
      existing.sessions.push({ date: dateISO, sets });
    } else {
      byLabel.set(label, {
        label,
        targetRepsHigh: l.plannedActivity.targetRepsHigh,
        perSide: l.plannedActivity.perSide,
        points: [point],
        sessions: [{ date: dateISO, sets }],
      });
    }
  }

  const exercises = Array.from(byLabel.values()).sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="pb-8">
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">Strength progression</h1>
        <p className="text-sm text-muted-foreground">Weight × reps over time per exercise.</p>
      </header>

      {exercises.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          Log a strength session to see progression here.
        </div>
      ) : (
        <div className="space-y-4 px-4">
          {exercises.map((ex) => {
            const suggestion = suggestNextStep(ex);
            const latest = ex.sessions[ex.sessions.length - 1];
            return (
              <Card key={ex.label}>
                <CardHeader>
                  <CardTitle className="flex items-baseline justify-between gap-2">
                    <span className="truncate">{ex.label}</span>
                    <span className="text-xs font-normal text-muted-foreground shrink-0">
                      {ex.sessions.length} {ex.sessions.length === 1 ? "session" : "sessions"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StrengthChart points={ex.points} />
                  <div className="text-xs text-muted-foreground">
                    Latest ({latest.date.slice(5)}):{" "}
                    {latest.sets.map((s, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        {s.reps}×{s.weightKg}kg
                      </span>
                    ))}
                    {ex.perSide ? " (each side)" : ""}
                  </div>
                  {suggestion && (
                    <div className="rounded-md border border-status-blue/40 bg-status-blue/10 px-3 py-2 text-xs text-foreground">
                      {suggestion}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
