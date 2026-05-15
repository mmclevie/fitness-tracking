"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveBodyMeasurement } from "@/app/body/actions";

export function BodyForm({ defaultDate }: { defaultDate: string }) {
  const [pending, start] = useTransition();
  const [date, setDate] = useState(defaultDate);
  const [w, setW] = useState("");
  const [m, setM] = useState("");
  const [f, setF] = useState("");

  function save() {
    if (!w && !m && !f) return;
    start(async () => {
      await saveBodyMeasurement({
        date,
        weightKg: w ? parseFloat(w) : undefined,
        muscleMassKg: m ? parseFloat(m) : undefined,
        bodyFatPct: f ? parseFloat(f) : undefined,
      });
      setW(""); setM(""); setF("");
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <label className="text-xs text-muted-foreground space-y-1 block">
        <span>Date</span>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-muted-foreground space-y-1 block">
          <span>Weight (kg)</span>
          <Input type="number" inputMode="decimal" step="0.1" value={w} onChange={(e) => setW(e.target.value)} />
        </label>
        <label className="text-xs text-muted-foreground space-y-1 block">
          <span>Muscle (kg)</span>
          <Input type="number" inputMode="decimal" step="0.1" value={m} onChange={(e) => setM(e.target.value)} />
        </label>
        <label className="text-xs text-muted-foreground space-y-1 block">
          <span>Body fat (%)</span>
          <Input type="number" inputMode="decimal" step="0.1" value={f} onChange={(e) => setF(e.target.value)} />
        </label>
      </div>
      <Button onClick={save} disabled={pending} className="w-full">Save</Button>
    </div>
  );
}
