"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

export async function createHoliday(formData: FormData) {
  await requireUser();
  const date = new Date(String(formData.get("date")));
  date.setHours(0, 0, 0, 0);
  await prisma.hRMHoliday.create({
    data: {
      name: String(formData.get("name") ?? ""),
      date,
      type: (String(formData.get("type") ?? "NATIONAL")) as "NATIONAL" | "COMPANY" | "BRANCH" | "OPTIONAL",
      isRecurring: formData.get("isRecurring") === "true",
      description: formData.get("description") ? String(formData.get("description")) : null,
    },
  });
  revalidatePath("/hrm/holidays");
}

export async function updateHoliday(id: number, formData: FormData) {
  await requireUser();
  const date = new Date(String(formData.get("date")));
  date.setHours(0, 0, 0, 0);
  await prisma.hRMHoliday.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? ""),
      date,
      type: (String(formData.get("type") ?? "NATIONAL")) as "NATIONAL" | "COMPANY" | "BRANCH" | "OPTIONAL",
      isRecurring: formData.get("isRecurring") === "true",
      description: formData.get("description") ? String(formData.get("description")) : null,
    },
  });
  revalidatePath("/hrm/holidays");
}

export async function deleteHoliday(id: number) {
  await requireUser();
  await prisma.hRMHoliday.delete({ where: { id } });
  revalidatePath("/hrm/holidays");
}
