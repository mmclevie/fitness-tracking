import Link from "next/link";
import { DateTime } from "luxon";
import { TZ } from "@/lib/dates";
import { statusDotColour, type StatusColour } from "@/lib/status";
import { cn } from "@/lib/utils";

interface Props {
  date: DateTime;
  sessionType: string;
  sessionLabel: string;
  status: StatusColour;
  isToday: boolean;
  isInPlan: boolean;
}

const WEEKDAY_LETTER = ["M", "T", "W", "T", "F", "S", "S"];

export function DayRow({ date, sessionType, sessionLabel, status, isToday, isInPlan }: Props) {
  const d = date.setZone(TZ);
  const href = `/day/${d.toISODate()}`;

  return (
    <Link
      href={href}
      id={`day-${d.toISODate()}`}
      className={cn(
        "flex items-center gap-4 px-4 min-h-16 border-b border-border active:bg-accent transition-colors",
        isToday && "bg-accent/40",
        !isInPlan && "opacity-50"
      )}
    >
      <div className="flex flex-col items-center w-9 shrink-0">
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider",
            isToday ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {WEEKDAY_LETTER[d.weekday - 1]}
        </span>
        <span
          className={cn(
            "text-xl font-semibold leading-none mt-0.5",
            isToday && "text-foreground"
          )}
        >
          {d.day}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{sessionType}</div>
        {sessionLabel && (
          <div className="text-xs text-muted-foreground truncate">{sessionLabel}</div>
        )}
      </div>
      <span className={cn("h-3 w-3 rounded-full shrink-0", statusDotColour(status))} aria-hidden />
    </Link>
  );
}
