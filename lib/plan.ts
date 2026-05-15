// Single source of truth for the 21-week half marathon plan.
// Race day: Sun 11 Oct 2026. Week 1 starts Mon 18 May 2026.

export type Kind = "run" | "swim" | "strength" | "structure";

export type SessionType =
  | "Strength A — Squat day"
  | "Strength B — Hinge day"
  | "Easy Run"
  | "Quality Run"
  | "Swim"
  | "Long Run"
  | "Rest"
  | "Race Day"
  | "Shakeout";

export type Phase = "Base" | "Build" | "Peak" | "Taper" | "Race";

export interface PlannedActivityDef {
  order: number;
  kind: Kind;
  label: string;
  targetValue?: number;
  targetUnit?: "reps" | "sets" | "m" | "km" | "minutes" | "seconds";
  targetSets?: number;
  targetRepsLow?: number;
  targetRepsHigh?: number;
  perSide?: boolean;
}

export interface DayDef {
  weekdayMonday1to7: number; // 1=Mon..7=Sun
  sessionType: SessionType;
  activities: PlannedActivityDef[];
}

export interface WeekPlan {
  weekNumber: number;
  phase: Phase;
  label: string;
  days: DayDef[];
}

// ----- Strength session definitions ------------------------------------------

interface StrengthExercise {
  label: string;
  baseSets: number;
  baseRepsLow: number;
  baseRepsHigh: number;
  perSide?: boolean;
  isCompound?: boolean; // compounds become 3x5 from week 13
}

const STRENGTH_A_EXERCISES: StrengthExercise[] = [
  { label: "Goblet or front squat", baseSets: 4, baseRepsLow: 6, baseRepsHigh: 8, isCompound: true },
  { label: "Bulgarian split squat (DB)", baseSets: 3, baseRepsLow: 8, baseRepsHigh: 8, perSide: true },
  { label: "DB bench press", baseSets: 3, baseRepsLow: 8, baseRepsHigh: 10, isCompound: true },
  { label: "Single-arm DB row", baseSets: 3, baseRepsLow: 10, baseRepsHigh: 10, perSide: true },
  { label: "Side plank", baseSets: 3, baseRepsLow: 30, baseRepsHigh: 45, perSide: true }, // seconds, not reps
];

const STRENGTH_B_EXERCISES: StrengthExercise[] = [
  { label: "Trap bar or Romanian deadlift", baseSets: 4, baseRepsLow: 6, baseRepsHigh: 8, isCompound: true },
  { label: "Walking lunges (DB)", baseSets: 3, baseRepsLow: 10, baseRepsHigh: 10, perSide: true },
  { label: "Standing overhead press", baseSets: 3, baseRepsLow: 6, baseRepsHigh: 8, isCompound: true },
  { label: "Pull-up or lat pulldown", baseSets: 3, baseRepsLow: 6, baseRepsHigh: 10 },
  { label: "Single-leg calf raise", baseSets: 3, baseRepsLow: 12, baseRepsHigh: 15, perSide: true },
  { label: "Pallof press", baseSets: 3, baseRepsLow: 10, baseRepsHigh: 10, perSide: true },
];

function strengthActivitiesFor(
  weekNumber: number,
  exercises: StrengthExercise[]
): PlannedActivityDef[] {
  const phase3 = weekNumber >= 13;
  const taper = weekNumber >= 19;
  return exercises.map((ex, i) => {
    let sets = ex.baseSets;
    let lo = ex.baseRepsLow;
    let hi = ex.baseRepsHigh;
    if (phase3) {
      if (ex.isCompound) {
        sets = 3;
        lo = 5;
        hi = 5;
      } else {
        sets = 1;
      }
    }
    if (taper) {
      sets = Math.max(1, Math.floor(sets * 0.6));
    }
    return {
      order: i,
      kind: "strength" as Kind,
      label: ex.label + (taper ? " (maintenance — light)" : ""),
      targetSets: sets,
      targetRepsLow: lo,
      targetRepsHigh: hi,
      perSide: ex.perSide,
    };
  });
}

// ----- Per-week run/swim parameters (from the brief) -------------------------

interface WeekRunSwim {
  phase: Phase;
  tueEasyKm: number;
  thuQuality: PlannedActivityDef[]; // expanded into WU + main + CD
  friSwimM: number;
  satLongRun: PlannedActivityDef[]; // one or more rows
  satLongLabel: string;
  weekLabel: string;
  custom?: Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7, DayDef>>;
}

function runActivity(label: string, km: number, order = 0): PlannedActivityDef {
  return {
    order,
    kind: "run",
    label,
    targetValue: km,
    targetUnit: "km",
  };
}

function swimActivity(label: string, m: number): PlannedActivityDef {
  return {
    order: 0,
    kind: "swim",
    label,
    targetValue: m,
    targetUnit: "m",
  };
}

function intervalSession(label: string, totalKm: number): PlannedActivityDef[] {
  return [
    { order: 0, kind: "structure", label: "Warm-up 1km easy", targetValue: 1, targetUnit: "km" },
    { order: 1, kind: "run", label, targetValue: totalKm - 2, targetUnit: "km" },
    { order: 2, kind: "structure", label: "Cool-down 1km easy", targetValue: 1, targetUnit: "km" },
  ];
}

function tempoSession(tempoKm: number): PlannedActivityDef[] {
  return [
    { order: 0, kind: "structure", label: "Warm-up 1km easy", targetValue: 1, targetUnit: "km" },
    { order: 1, kind: "run", label: `${tempoKm}km tempo`, targetValue: tempoKm, targetUnit: "km" },
    { order: 2, kind: "structure", label: "Cool-down 1km easy", targetValue: 1, targetUnit: "km" },
  ];
}

function easyQuality(km: number): PlannedActivityDef[] {
  return [runActivity(`${km}km easy`, km)];
}

function plainLong(km: number): PlannedActivityDef[] {
  return [runActivity(`Long run ${km}km`, km)];
}

function longWithRacePaceTail(totalKm: number, rpKm: number): PlannedActivityDef[] {
  return [
    runActivity(`Long run ${totalKm}km — last ${rpKm}km at race pace`, totalKm),
  ];
}

const WEEK_DATA: WeekRunSwim[] = [
  // 1
  { phase: "Base", weekLabel: "Base", tueEasyKm: 3, thuQuality: easyQuality(3), friSwimM: 800, satLongRun: plainLong(4), satLongLabel: "4km" },
  // 2
  { phase: "Base", weekLabel: "Base", tueEasyKm: 4, thuQuality: easyQuality(3), friSwimM: 1000, satLongRun: plainLong(5), satLongLabel: "5km" },
  // 3
  { phase: "Base", weekLabel: "Base", tueEasyKm: 4, thuQuality: easyQuality(4), friSwimM: 1200, satLongRun: plainLong(6), satLongLabel: "6km" },
  // 4 stepback
  { phase: "Base", weekLabel: "Base (stepback)", tueEasyKm: 3, thuQuality: easyQuality(3), friSwimM: 1000, satLongRun: plainLong(5), satLongLabel: "5km" },
  // 5
  { phase: "Base", weekLabel: "Base", tueEasyKm: 5, thuQuality: easyQuality(4), friSwimM: 1500, satLongRun: plainLong(8), satLongLabel: "8km" },
  // 6
  { phase: "Build", weekLabel: "Build", tueEasyKm: 5, thuQuality: intervalSession("4x400m intervals", 4), friSwimM: 1500, satLongRun: plainLong(9), satLongLabel: "9km" },
  // 7
  { phase: "Build", weekLabel: "Build", tueEasyKm: 5, thuQuality: intervalSession("5x400m intervals", 4.5), friSwimM: 1750, satLongRun: plainLong(10), satLongLabel: "10km" },
  // 8 stepback
  { phase: "Build", weekLabel: "Build (stepback)", tueEasyKm: 4, thuQuality: intervalSession("4x400m intervals", 3.5), friSwimM: 1500, satLongRun: plainLong(8), satLongLabel: "8km" },
  // 9
  { phase: "Build", weekLabel: "Build", tueEasyKm: 6, thuQuality: tempoSession(3), friSwimM: 2000, satLongRun: plainLong(11), satLongLabel: "11km" },
  // 10
  { phase: "Build", weekLabel: "Build", tueEasyKm: 6, thuQuality: intervalSession("6x600m intervals", 6), friSwimM: 2000, satLongRun: plainLong(13), satLongLabel: "13km" },
  // 11
  { phase: "Build", weekLabel: "Build", tueEasyKm: 7, thuQuality: tempoSession(4), friSwimM: 2000, satLongRun: plainLong(14), satLongLabel: "14km" },
  // 12 stepback
  { phase: "Build", weekLabel: "Build (stepback)", tueEasyKm: 5, thuQuality: tempoSession(3), friSwimM: 1750, satLongRun: plainLong(12), satLongLabel: "12km" },
  // 13
  { phase: "Peak", weekLabel: "Peak", tueEasyKm: 7, thuQuality: intervalSession("5x1km threshold", 8), friSwimM: 2000, satLongRun: plainLong(16), satLongLabel: "16km" },
  // 14
  { phase: "Peak", weekLabel: "Peak", tueEasyKm: 8, thuQuality: tempoSession(6), friSwimM: 2000, satLongRun: longWithRacePaceTail(17, 3), satLongLabel: "17km (last 3km race pace)" },
  // 15 stepback
  { phase: "Peak", weekLabel: "Peak (stepback)", tueEasyKm: 6, thuQuality: intervalSession("4x1km threshold", 6), friSwimM: 1750, satLongRun: plainLong(14), satLongLabel: "14km" },
  // 16
  { phase: "Peak", weekLabel: "Peak", tueEasyKm: 8, thuQuality: tempoSession(7), friSwimM: 2000, satLongRun: longWithRacePaceTail(18, 4), satLongLabel: "18km (last 4km race pace)" },
  // 17
  { phase: "Peak", weekLabel: "Peak", tueEasyKm: 8, thuQuality: intervalSession("6x1km threshold", 9), friSwimM: 2000, satLongRun: longWithRacePaceTail(20, 5), satLongLabel: "20km (last 5km race pace)" },
  // 18
  { phase: "Peak", weekLabel: "Peak", tueEasyKm: 7, thuQuality: tempoSession(5), friSwimM: 1750, satLongRun: plainLong(19), satLongLabel: "19km" },
  // 19 taper
  { phase: "Taper", weekLabel: "Taper", tueEasyKm: 6, thuQuality: tempoSession(4), friSwimM: 1500, satLongRun: plainLong(14), satLongLabel: "14km" },
  // 20 taper
  { phase: "Taper", weekLabel: "Taper", tueEasyKm: 5, thuQuality: intervalSession("4x400m at race pace", 4), friSwimM: 1200, satLongRun: plainLong(10), satLongLabel: "10km" },
  // 21 race week — custom layout below
  { phase: "Race", weekLabel: "Race Week", tueEasyKm: 5, thuQuality: [], friSwimM: 0, satLongRun: [], satLongLabel: "Race Day" },
];

// ----- Build WeekPlan list ---------------------------------------------------

export function buildPlan(): WeekPlan[] {
  const weeks: WeekPlan[] = [];

  for (let w = 1; w <= 21; w++) {
    const data = WEEK_DATA[w - 1];
    const days: DayDef[] = [];

    if (w === 21) {
      // Race week: Mon Rest, Tue 5km easy, Wed 3km + strides, Thu Rest, Fri 3km shakeout, Sat Rest, Sun RACE
      days.push({
        weekdayMonday1to7: 1,
        sessionType: "Rest",
        activities: [],
      });
      days.push({
        weekdayMonday1to7: 2,
        sessionType: "Easy Run",
        activities: [runActivity("5km easy", 5)],
      });
      days.push({
        weekdayMonday1to7: 3,
        sessionType: "Quality Run",
        activities: [
          runActivity("3km easy", 3, 0),
          { order: 1, kind: "structure", label: "4x100m strides", targetValue: 4, targetUnit: "reps" },
        ],
      });
      days.push({
        weekdayMonday1to7: 4,
        sessionType: "Rest",
        activities: [],
      });
      days.push({
        weekdayMonday1to7: 5,
        sessionType: "Shakeout",
        activities: [runActivity("3km shakeout", 3)],
      });
      days.push({
        weekdayMonday1to7: 6,
        sessionType: "Rest",
        activities: [],
      });
      days.push({
        weekdayMonday1to7: 7,
        sessionType: "Race Day",
        activities: [runActivity("Half marathon — 21.1km", 21.1)],
      });
    } else {
      // Mon: Strength A — Squat day (knee-dominant + horizontal push/pull)
      days.push({
        weekdayMonday1to7: 1,
        sessionType: "Strength A — Squat day",
        activities: strengthActivitiesFor(w, STRENGTH_A_EXERCISES),
      });
      // Tue: Easy Run
      days.push({
        weekdayMonday1to7: 2,
        sessionType: "Easy Run",
        activities: [runActivity(`${data.tueEasyKm}km easy`, data.tueEasyKm)],
      });
      // Wed: Strength B — Hinge day (hip-dominant + vertical push/pull)
      days.push({
        weekdayMonday1to7: 3,
        sessionType: "Strength B — Hinge day",
        activities: strengthActivitiesFor(w, STRENGTH_B_EXERCISES),
      });
      // Thu: Quality Run
      days.push({
        weekdayMonday1to7: 4,
        sessionType: "Quality Run",
        activities: data.thuQuality,
      });
      // Fri: Swim
      days.push({
        weekdayMonday1to7: 5,
        sessionType: "Swim",
        activities: [swimActivity(`${data.friSwimM}m swim`, data.friSwimM)],
      });
      // Sat: Long Run
      days.push({
        weekdayMonday1to7: 6,
        sessionType: "Long Run",
        activities: data.satLongRun,
      });
      // Sun: Rest (with optional recovery swim noted)
      days.push({
        weekdayMonday1to7: 7,
        sessionType: "Rest",
        activities: [],
      });
    }

    weeks.push({
      weekNumber: w,
      phase: data.phase,
      label: data.weekLabel,
      days,
    });
  }

  return weeks;
}
