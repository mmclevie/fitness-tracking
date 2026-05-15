"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isoToDbDate } from "@/lib/dates";

const Schema = z.object({
  date: z.string(),
  weightKg: z.number().min(20).max(300).optional(),
  muscleMassKg: z.number().min(0).max(150).optional(),
  bodyFatPct: z.number().min(0).max(80).optional(),
  notes: z.string().max(500).optional(),
});

export async function saveBodyMeasurement(input: z.infer<typeof Schema>) {
  const data = Schema.parse(input);
  const date = isoToDbDate(data.date);
  await prisma.bodyMeasurement.upsert({
    where: { date },
    update: {
      weightKg: data.weightKg ?? null,
      muscleMassKg: data.muscleMassKg ?? null,
      bodyFatPct: data.bodyFatPct ?? null,
      notes: data.notes ?? null,
    },
    create: {
      date,
      weightKg: data.weightKg ?? null,
      muscleMassKg: data.muscleMassKg ?? null,
      bodyFatPct: data.bodyFatPct ?? null,
      notes: data.notes ?? null,
    },
  });
  revalidatePath("/body");
}

export async function deleteBodyMeasurement(id: string) {
  await prisma.bodyMeasurement.delete({ where: { id } });
  revalidatePath("/body");
}
