"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { computeDayStatus } from "@/lib/status";
import { isoToDbDate } from "@/lib/dates";

function dateJs(iso: string) {
  return isoToDbDate(iso);
}

async function recomputeDayStatus(dayId: string) {
  const day = await prisma.day.findUnique({
    where: { id: dayId },
    include: { planned: true, logged: true },
  });
  if (!day) return;
  const { status, percent } = computeDayStatus(day);
  await prisma.day.update({
    where: { id: dayId },
    data: { status, percentComplete: percent },
  });
}

const RunSchema = z.object({
  date: z.string(),
  plannedActivityId: z.string().nullable(),
  distanceKm: z.number().min(0).max(100).optional(),
  durationMin: z.number().min(0).max(600).optional(),
  avgHr: z.number().int().min(40).max(220).optional(),
  notes: z.string().optional(),
  loggedActivityId: z.string().optional(),
});

export async function saveRunLog(input: z.infer<typeof RunSchema>) {
  const data = RunSchema.parse(input);
  const day = await prisma.day.findUnique({ where: { date: dateJs(data.date) } });
  if (!day) throw new Error("Day not found");

  const payload = {
    dayId: day.id,
    plannedActivityId: data.plannedActivityId,
    distanceM: data.distanceKm != null ? Math.round(data.distanceKm * 1000) : null,
    durationSec: data.durationMin != null ? Math.round(data.durationMin * 60) : null,
    avgHr: data.avgHr ?? null,
    notes: data.notes ?? null,
  };

  if (data.loggedActivityId) {
    await prisma.loggedActivity.update({ where: { id: data.loggedActivityId }, data: payload });
  } else {
    await prisma.loggedActivity.create({ data: payload });
  }
  await recomputeDayStatus(day.id);
  revalidatePath("/");
  revalidatePath(`/day/${data.date}`);
}

const SwimSchema = z.object({
  date: z.string(),
  plannedActivityId: z.string().nullable(),
  distanceM: z.number().min(0).max(10000).optional(),
  durationMin: z.number().min(0).max(600).optional(),
  poolNotOpenWater: z.boolean().optional(),
  notes: z.string().optional(),
  loggedActivityId: z.string().optional(),
});

export async function saveSwimLog(input: z.infer<typeof SwimSchema>) {
  const data = SwimSchema.parse(input);
  const day = await prisma.day.findUnique({ where: { date: dateJs(data.date) } });
  if (!day) throw new Error("Day not found");

  const payload = {
    dayId: day.id,
    plannedActivityId: data.plannedActivityId,
    distanceM: data.distanceM != null ? Math.round(data.distanceM) : null,
    durationSec: data.durationMin != null ? Math.round(data.durationMin * 60) : null,
    poolNotOpenWater: data.poolNotOpenWater ?? null,
    notes: data.notes ?? null,
  };

  if (data.loggedActivityId) {
    await prisma.loggedActivity.update({ where: { id: data.loggedActivityId }, data: payload });
  } else {
    await prisma.loggedActivity.create({ data: payload });
  }
  await recomputeDayStatus(day.id);
  revalidatePath("/");
  revalidatePath(`/day/${data.date}`);
}

const StrengthSetSchema = z.object({
  reps: z.number().int().min(0).max(100),
  weightKg: z.number().min(0).max(500),
});
const StrengthSchema = z.object({
  date: z.string(),
  plannedActivityId: z.string(),
  sets: z.array(StrengthSetSchema),
  notes: z.string().optional(),
  loggedActivityId: z.string().optional(),
});

export async function saveStrengthLog(input: z.infer<typeof StrengthSchema>) {
  const data = StrengthSchema.parse(input);
  const day = await prisma.day.findUnique({ where: { date: dateJs(data.date) } });
  if (!day) throw new Error("Day not found");

  const payload = {
    dayId: day.id,
    plannedActivityId: data.plannedActivityId,
    setsJson: data.sets,
    notes: data.notes ?? null,
  };

  if (data.loggedActivityId) {
    await prisma.loggedActivity.update({ where: { id: data.loggedActivityId }, data: payload });
  } else {
    await prisma.loggedActivity.create({ data: payload });
  }
  await recomputeDayStatus(day.id);
  revalidatePath("/");
  revalidatePath(`/day/${data.date}`);
  revalidatePath("/strength");
}

const StructureSchema = z.object({
  date: z.string(),
  plannedActivityId: z.string(),
  done: z.boolean(),
  loggedActivityId: z.string().optional(),
});

export async function toggleStructureItem(input: z.infer<typeof StructureSchema>) {
  const data = StructureSchema.parse(input);
  const day = await prisma.day.findUnique({ where: { date: dateJs(data.date) } });
  if (!day) throw new Error("Day not found");

  if (!data.done) {
    if (data.loggedActivityId) {
      await prisma.loggedActivity.delete({ where: { id: data.loggedActivityId } });
    }
  } else {
    if (data.loggedActivityId) {
      // already done
    } else {
      await prisma.loggedActivity.create({
        data: { dayId: day.id, plannedActivityId: data.plannedActivityId },
      });
    }
  }
  await recomputeDayStatus(day.id);
  revalidatePath("/");
  revalidatePath(`/day/${data.date}`);
}

const CustomSchema = z.object({
  date: z.string(),
  label: z.string().min(1).max(100),
  distanceKm: z.number().min(0).max(100).optional(),
  durationMin: z.number().min(0).max(600).optional(),
  notes: z.string().optional(),
});

export async function addCustomActivity(input: z.infer<typeof CustomSchema>) {
  const data = CustomSchema.parse(input);
  const day = await prisma.day.findUnique({ where: { date: dateJs(data.date) } });
  if (!day) throw new Error("Day not found");

  await prisma.loggedActivity.create({
    data: {
      dayId: day.id,
      customLabel: data.label,
      distanceM: data.distanceKm != null ? Math.round(data.distanceKm * 1000) : null,
      durationSec: data.durationMin != null ? Math.round(data.durationMin * 60) : null,
      notes: data.notes ?? null,
    },
  });
  await recomputeDayStatus(day.id);
  revalidatePath("/");
  revalidatePath(`/day/${data.date}`);
}

export async function deleteLoggedActivity(date: string, loggedId: string) {
  const day = await prisma.day.findUnique({ where: { date: dateJs(date) } });
  if (!day) throw new Error("Day not found");
  await prisma.loggedActivity.delete({ where: { id: loggedId } });
  await recomputeDayStatus(day.id);
  revalidatePath("/");
  revalidatePath(`/day/${date}`);
}

export async function skipDay(date: string) {
  const day = await prisma.day.findUnique({ where: { date: dateJs(date) }, include: { logged: true } });
  if (!day) throw new Error("Day not found");
  // Wipe logs and force red
  await prisma.loggedActivity.deleteMany({ where: { dayId: day.id } });
  await prisma.day.update({
    where: { id: day.id },
    data: { status: "red", percentComplete: 0 },
  });
  revalidatePath("/");
  revalidatePath(`/day/${date}`);
}

export async function markRestComplete(date: string) {
  const day = await prisma.day.findUnique({ where: { date: dateJs(date) } });
  if (!day) throw new Error("Day not found");
  if (day.sessionType !== "Rest") return;
  await prisma.day.update({
    where: { id: day.id },
    data: { status: "blue", percentComplete: 100 },
  });
  revalidatePath("/");
  revalidatePath(`/day/${date}`);
}

export async function recalcDay(date: string) {
  const day = await prisma.day.findUnique({ where: { date: dateJs(date) } });
  if (!day) throw new Error("Day not found");
  await recomputeDayStatus(day.id);
  revalidatePath("/");
  revalidatePath(`/day/${date}`);
}

const NotesSchema = z.object({ date: z.string(), notes: z.string().max(2000) });
export async function saveNotes(input: z.infer<typeof NotesSchema>) {
  const data = NotesSchema.parse(input);
  const day = await prisma.day.findUnique({ where: { date: dateJs(data.date) } });
  if (!day) throw new Error("Day not found");
  await prisma.day.update({ where: { id: day.id }, data: { notes: data.notes } });
  revalidatePath(`/day/${data.date}`);
}
