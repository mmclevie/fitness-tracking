import { getAllBodyMeasurements } from "@/lib/queries";
import { DateTime } from "luxon";
import { TZ, today } from "@/lib/dates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BodyForm } from "@/components/body/body-form";
import { BodyChart, type BodyPoint } from "@/components/charts/body-chart";

export const dynamic = "force-dynamic";

function isoWeekKey(d: DateTime): string {
  const wy = d.weekYear;
  const w = d.weekNumber;
  return `${wy}-W${String(w).padStart(2, "0")}`;
}

interface Measurement {
  date: Date;
  weightKg: number | null;
  muscleMassKg: number | null;
  bodyFatPct: number | null;
}

function weeklyAverages(measurements: Measurement[]): BodyPoint[] {
  const buckets = new Map<string, { weights: number[]; muscles: number[]; bfs: number[]; firstDate: DateTime }>();
  for (const m of measurements) {
    const d = DateTime.fromJSDate(m.date, { zone: TZ });
    const key = isoWeekKey(d);
    const b = buckets.get(key) ?? { weights: [], muscles: [], bfs: [], firstDate: d };
    if (m.weightKg != null) b.weights.push(m.weightKg);
    if (m.muscleMassKg != null) b.muscles.push(m.muscleMassKg);
    if (m.bodyFatPct != null) b.bfs.push(m.bodyFatPct);
    buckets.set(key, b);
  }
  function avg(arr: number[]): number | null {
    if (arr.length === 0) return null;
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      weekLabel: key.slice(5), // "W23"
      weight: avg(b.weights),
      muscle: avg(b.muscles),
      bodyFat: avg(b.bfs),
    }));
}

export default async function BodyPage() {
  const measurements = await getAllBodyMeasurements();
  const points = weeklyAverages(measurements);
  const todayIso = today().toISODate()!;

  const latest = measurements[measurements.length - 1] ?? null;

  return (
    <div className="pb-8">
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">Body composition</h1>
        <p className="text-sm text-muted-foreground">Weekly averages of weight, muscle, body fat.</p>
      </header>

      <div className="space-y-4 px-4">
        <BodyForm defaultDate={todayIso} />

        {latest && (
          <Card>
            <CardHeader>
              <CardTitle>Latest · {DateTime.fromJSDate(latest.date, { zone: TZ }).toFormat("d LLL")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Weight</div>
                <div className="text-lg font-semibold">{latest.weightKg ?? "—"}{latest.weightKg != null && "kg"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Muscle</div>
                <div className="text-lg font-semibold">{latest.muscleMassKg ?? "—"}{latest.muscleMassKg != null && "kg"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Body fat</div>
                <div className="text-lg font-semibold">{latest.bodyFatPct ?? "—"}{latest.bodyFatPct != null && "%"}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {points.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No measurements yet — log one above.
          </div>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle>Weight</CardTitle></CardHeader>
              <CardContent><BodyChart points={points} dataKey="weight" color="#fafafa" unit="kg" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Muscle mass</CardTitle></CardHeader>
              <CardContent><BodyChart points={points} dataKey="muscle" color="#22c55e" unit="kg" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Body fat</CardTitle></CardHeader>
              <CardContent><BodyChart points={points} dataKey="bodyFat" color="#eab308" unit="%" /></CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
