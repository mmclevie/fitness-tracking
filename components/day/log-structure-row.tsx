"use client";
import { useTransition } from "react";
import { toggleStructureItem } from "@/app/day/[date]/actions";
import type { PlannedActivity, LoggedActivity } from "@prisma/client";
import { Check } from "lucide-react";

interface Props {
  date: string;
  planned: PlannedActivity;
  log: LoggedActivity | null;
}

export function LogStructureRow({ date, planned, log }: Props) {
  const [pending, start] = useTransition();
  const done = !!log;

  function toggle() {
    start(async () => {
      await toggleStructureItem({
        date,
        plannedActivityId: planned.id,
        done: !done,
        loggedActivityId: log?.id,
      });
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border active:bg-accent disabled:opacity-50"
    >
      <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${done ? "bg-status-green border-status-green" : "border-border"}`}>
        {done && <Check className="h-3 w-3 text-background" strokeWidth={3} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{planned.label}</div>
      </div>
    </button>
  );
}
