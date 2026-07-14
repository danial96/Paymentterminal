"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

export async function createShift(formData: FormData) {
  await requireUser();
  const workingDays = formData.getAll("workingDays").map(String);
  await prisma.hRMShift.create({
    data: {
      name: String(formData.get("name") ?? ""),
      startTime: String(formData.get("startTime") ?? "09:00"),
      endTime: String(formData.get("endTime") ?? "18:00"),
      breakMinutes: Number(formData.get("breakMinutes") ?? 60),
      workingDays,
      shiftType: (String(formData.get("shiftType") ?? "MORNING")) as "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | "FLEXIBLE" | "ROTATIONAL" | "CUSTOM",
      customLabel: formData.get("shiftType") === "CUSTOM" ? (String(formData.get("customLabel") ?? "")).trim() || null : null,
      isActive: formData.get("isActive") !== "false",
    },
  });
  revalidatePath("/hrm/shifts");
}

export async function updateShift(id: number, formData: FormData) {
  await requireUser();
  const workingDays = formData.getAll("workingDays").map(String);
  await prisma.hRMShift.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? ""),
      startTime: String(formData.get("startTime") ?? "09:00"),
      endTime: String(formData.get("endTime") ?? "18:00"),
      breakMinutes: Number(formData.get("breakMinutes") ?? 60),
      workingDays,
      shiftType: (String(formData.get("shiftType") ?? "MORNING")) as "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | "FLEXIBLE" | "ROTATIONAL" | "CUSTOM",
      customLabel: formData.get("shiftType") === "CUSTOM" ? (String(formData.get("customLabel") ?? "")).trim() || null : null,
      isActive: formData.get("isActive") !== "false",
    },
  });
  revalidatePath("/hrm/shifts");
}

export async function deleteShift(id: number) {
  await requireUser();
  await prisma.hRMShift.delete({ where: { id } });
  revalidatePath("/hrm/shifts");
}
