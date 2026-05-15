"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addCustomActivity, skipDay, markRestComplete, saveNotes, deleteLoggedActivity } from "@/app/day/[date]/actions";
import { Plus, X } from "lucide-react";
import type { LoggedActivity } from "@prisma/client";

interface CustomLog extends LoggedActivity { customLabel: string | null }
interface Props {
  date: string;
  sessionType: string;
  initialNotes: string;
  customLogs: CustomLog[];
}

export function DayActions({ date, sessionType, initialNotes, customLogs }: Props) {
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [km, setKm] = useState("");
  const [min, setMin] = useState("");
  const [notes, setNotes] = useState(initialNotes);
  const [confirmSkip, setConfirmSkip] = useState(false);

  function addCustom() {
    if (!label.trim()) return;
    start(async () => {
      await addCustomActivity({
        date,
        label: label.trim(),
        distanceKm: km ? parseFloat(km) : undefined,
        durationMin: min ? parseFloat(min) : undefined,
      });
      setLabel(""); setKm(""); setMin(""); setAdding(false);
    });
  }

  function doSkip() {
    if (!confirmSkip) { setConfirmSkip(true); return; }
    start(async () => {
      await skipDay(date);
      setConfirmSkip(false);
    });
  }

  function doMarkRest() {
    start(async () => { await markRestComplete(date); });
  }

  function persistNotes() {
    start(async () => { await saveNotes({ date, notes }); });
  }

  function removeCustom(id: string) {
    start(async () => { await deleteLoggedActivity(date, id); });
  }

  const isRest = sessionType === "Rest";

  return (
    <div className="space-y-6 px-4 pt-4">
      {customLogs.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Custom activities</h3>
          <ul className="space-y-2">
            {customLogs.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
                <div className="text-sm min-w-0">
                  <div className="font-medium truncate">{c.customLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.distanceM != null && `${(c.distanceM / 1000).toFixed(2)}km`}
                    {c.distanceM != null && c.durationSec != null && " · "}
                    {c.durationSec != null && `${Math.round(c.durationSec / 60)} min`}
                  </div>
                </div>
                <button
                  onClick={() => removeCustom(c.id)}
                  className="h-11 w-11 flex items-center justify-center text-muted-foreground"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!adding ? (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full">
          <Plus className="h-4 w-4" /> Add custom activity
        </Button>
      ) : (
        <div className="space-y-2 rounded-md border border-border bg-card p-3">
          <Input placeholder="What did you do?" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" inputMode="decimal" step="0.01" placeholder="km" value={km} onChange={(e) => setKm(e.target.value)} />
            <Input type="number" inputMode="decimal" step="0.1" placeholder="min" value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={addCustom} disabled={pending} className="flex-1">Add</Button>
            <Button onClick={() => setAdding(false)} variant="secondary">Cancel</Button>
          </div>
        </div>
      )}

      <section className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={persistNotes}
          placeholder="How did it feel?"
          rows={3}
        />
      </section>

      <section className="grid grid-cols-2 gap-2">
        {isRest ? (
          <Button onClick={doMarkRest} disabled={pending} className="col-span-2">Mark rest complete</Button>
        ) : (
          <Button
            onClick={doSkip}
            disabled={pending}
            variant={confirmSkip ? "destructive" : "secondary"}
            className="col-span-2"
          >
            {confirmSkip ? "Tap again to confirm skip" : "Skip day"}
          </Button>
        )}
      </section>
    </div>
  );
}
