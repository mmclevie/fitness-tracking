"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveRunLog, deleteLoggedActivity } from "@/app/day/[date]/actions";
import type { PlannedActivity, LoggedActivity } from "@prisma/client";
import { Check, Trash2 } from "lucide-react";

interface Props {
  date: string;
  planned: PlannedActivity;
  log: LoggedActivity | null;
}

export function LogRunRow({ date, planned, log }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [km, setKm] = useState(log?.distanceM != null ? (log.distanceM / 1000).toString() : "");
  const [min, setMin] = useState(log?.durationSec != null ? Math.round(log.durationSec / 60).toString() : "");
  const [hr, setHr] = useState(log?.avgHr?.toString() ?? "");

  const done = !!log && log.distanceM != null;

  function save() {
    start(async () => {
      await saveRunLog({
        date,
        plannedActivityId: planned.id,
        distanceKm: km ? parseFloat(km) : undefined,
        durationMin: min ? parseFloat(min) : undefined,
        avgHr: hr ? parseInt(hr, 10) : undefined,
        loggedActivityId: log?.id,
      });
      setOpen(false);
    });
  }

  function remove() {
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
        <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${done ? "bg-status-green border-status-green" : "border-border"}`}>
          {done && <Check className="h-3 w-3 text-background" strokeWidth={3} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{planned.label}</div>
          {done && (
            <div className="text-xs text-muted-foreground">
              {(log!.distanceM! / 1000).toFixed(2)}km
              {log!.durationSec ? ` · ${Math.round(log!.durationSec / 60)} min` : ""}
              {log!.avgHr ? ` · ${log!.avgHr} bpm` : ""}
            </div>
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 bg-card/40">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground space-y-1 block">
              <span>Distance (km)</span>
              <Input type="number" inputMode="decimal" step="0.01" value={km} onChange={(e) => setKm(e.target.value)} />
            </label>
            <label className="text-xs text-muted-foreground space-y-1 block">
              <span>Time (min)</span>
              <Input type="number" inputMode="decimal" step="0.1" value={min} onChange={(e) => setMin(e.target.value)} />
            </label>
          </div>
          <label className="text-xs text-muted-foreground space-y-1 block">
            <span>Avg HR (bpm)</span>
            <Input type="number" inputMode="numeric" value={hr} onChange={(e) => setHr(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={pending} className="flex-1">Save</Button>
            {log && (
              <Button onClick={remove} disabled={pending} variant="secondary" size="icon" aria-label="Clear">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
