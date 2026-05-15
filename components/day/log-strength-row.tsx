"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveStrengthLog, deleteLoggedActivity } from "@/app/day/[date]/actions";
import type { PlannedActivity, LoggedActivity } from "@prisma/client";
import { Check, Plus, Trash2, Minus } from "lucide-react";

interface SetEntry { reps: number; weightKg: number }
interface Props {
  date: string;
  planned: PlannedActivity;
  log: LoggedActivity | null;
  lastSession: { sets: SetEntry[]; date: string } | null;
}

function targetRepsLabel(p: PlannedActivity): string {
  if (p.targetRepsLow == null) return "";
  if (p.targetRepsHigh == null || p.targetRepsLow === p.targetRepsHigh) {
    return `${p.targetRepsLow}`;
  }
  return `${p.targetRepsLow}–${p.targetRepsHigh}`;
}

function summary(sets: SetEntry[]): string {
  if (sets.length === 0) return "";
  const allSameW = sets.every((s) => s.weightKg === sets[0].weightKg);
  const reps = sets.map((s) => s.reps).join("/");
  if (allSameW) return `${sets.length}×${reps} @ ${sets[0].weightKg}kg`;
  const parts = sets.map((s) => `${s.reps}×${s.weightKg}kg`);
  return parts.join(", ");
}

export function LogStrengthRow({ date, planned, log, lastSession }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const initialSets: SetEntry[] = (log?.setsJson as unknown as SetEntry[] | null) ?? Array.from({ length: planned.targetSets ?? 3 }).map(() => ({ reps: planned.targetRepsLow ?? 0, weightKg: 0 }));
  const [sets, setSets] = useState<SetEntry[]>(initialSets);

  const done = (log?.setsJson as unknown as SetEntry[] | null)?.length ?? 0;
  const targetSets = planned.targetSets ?? 0;

  function updateSet(i: number, field: keyof SetEntry, val: string) {
    const num = parseFloat(val);
    setSets((cur) => cur.map((s, j) => (j === i ? { ...s, [field]: isNaN(num) ? 0 : num } : s)));
  }
  function addSet() {
    setSets((cur) => {
      const last = cur[cur.length - 1] ?? { reps: planned.targetRepsLow ?? 0, weightKg: 0 };
      return [...cur, { reps: last.reps, weightKg: last.weightKg }];
    });
  }
  function removeSet(i: number) {
    setSets((cur) => cur.filter((_, j) => j !== i));
  }
  function save() {
    start(async () => {
      await saveStrengthLog({ date, plannedActivityId: planned.id, sets, loggedActivityId: log?.id });
      setOpen(false);
    });
  }
  function clearLog() {
    if (!log) return;
    start(async () => {
      await deleteLoggedActivity(date, log.id);
      setOpen(false);
    });
  }

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-accent"
      >
        <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${done >= targetSets && targetSets > 0 ? "bg-status-green border-status-green" : done > 0 ? "bg-status-yellow border-status-yellow" : "border-border"}`}>
          {done > 0 && <Check className="h-3 w-3 text-background" strokeWidth={3} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{planned.label}</div>
          <div className="text-xs text-muted-foreground">
            {targetSets}×{targetRepsLabel(planned)}{planned.perSide ? " each side" : ""}
            {log?.setsJson != null && ` · logged ${summary((log.setsJson as unknown) as SetEntry[])}`}
          </div>
          {lastSession && (
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Last: {summary(lastSession.sets)}
            </div>
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 bg-card/40">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
              <Input
                type="number" inputMode="numeric"
                placeholder="reps"
                value={s.reps || ""}
                onChange={(e) => updateSet(i, "reps", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">×</span>
              <Input
                type="number" inputMode="decimal" step="0.5"
                placeholder="kg"
                value={s.weightKg || ""}
                onChange={(e) => updateSet(i, "weightKg", e.target.value)}
              />
              <button
                onClick={() => removeSet(i)}
                className="h-11 w-11 flex items-center justify-center text-muted-foreground active:text-foreground"
                aria-label="Remove set"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addSet}
            className="w-full min-h-11 flex items-center justify-center gap-1 rounded-md border border-dashed border-border text-sm text-muted-foreground"
          >
            <Plus className="h-4 w-4" /> Add set
          </button>
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={pending} className="flex-1">Save</Button>
            {log && (
              <Button onClick={clearLog} disabled={pending} variant="secondary" size="icon" aria-label="Clear">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
