interface Props {
  weekNumber: number;
  phaseLabel: string;
  plannedKm: number;
  loggedKm: number;
  sessionsPlanned: number;
  sessionsCompleted: number;
}

export function WeekSummary({
  weekNumber,
  phaseLabel,
  plannedKm,
  loggedKm,
  sessionsPlanned,
  sessionsCompleted,
}: Props) {
  return (
    <div className="px-4 pt-3 pb-2 bg-background sticky top-0 z-10 border-b border-border">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Week {weekNumber}
          </div>
          <div className="text-sm font-medium">{phaseLabel}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>
            <span className="text-foreground font-medium">{loggedKm.toFixed(1)}</span>
            <span className="mx-1">/</span>
            <span>{plannedKm.toFixed(0)}km</span>
          </div>
          <div>
            <span className="text-foreground font-medium">{sessionsCompleted}</span>
            <span className="mx-1">/</span>
            <span>{sessionsPlanned} sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
