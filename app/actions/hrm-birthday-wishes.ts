"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendBirthdayWish(formData: FormData) {
  const session = await auth();
  const fromId = Number((session?.user as any)?.employeeId);
  if (!fromId) return;

  const toId = Number(formData.get("toId"));
  const message = String(formData.get("message") ?? "").trim();
  if (!toId || !message) return;

  const year = new Date().getFullYear();

  // Upsert — allow updating message if already wished this year
  const existing = await (prisma as any).hRMBirthdayWish.findUnique({
    where: { fromId_toId_year: { fromId, toId, year } },
  });

  if (existing) {
    await (prisma as any).hRMBirthdayWish.update({
      where: { id: existing.id },
      data: { message },
    });
  } else {
    await (prisma as any).hRMBirthdayWish.create({
      data: { fromId, toId, message, year },
    });
  }

  revalidatePath("/portal/dashboard");
}
