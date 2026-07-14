"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

export async function createPerformanceReview(formData: FormData) {
  const user = await requireUser();
  await prisma.hRMPerformance.create({
    data: {
      employeeId: Number(formData.get("employeeId")),
      reviewPeriod: String(formData.get("reviewPeriod") ?? ""),
      reviewType: (String(formData.get("reviewType") ?? "QUARTERLY")) as "MONTHLY" | "QUARTERLY" | "ANNUAL" | "PROBATION",
      rating: Number(formData.get("rating") ?? 3),
      goals: formData.get("goals") ? String(formData.get("goals")) : null,
      achievements: formData.get("achievements") ? String(formData.get("achievements")) : null,
      improvements: formData.get("improvements") ? String(formData.get("improvements")) : null,
      managerComment: formData.get("managerComment") ? String(formData.get("managerComment")) : null,
      reviewedById: Number(user.id),
      reviewDate: new Date(),
    },
  });
  revalidatePath("/hrm/performance");
}

export async function updatePerformanceReview(id: number, formData: FormData) {
  await requireUser();
  await prisma.hRMPerformance.update({
    where: { id },
    data: {
      rating: Number(formData.get("rating") ?? 3),
      goals: formData.get("goals") ? String(formData.get("goals")) : null,
      achievements: formData.get("achievements") ? String(formData.get("achievements")) : null,
      improvements: formData.get("improvements") ? String(formData.get("improvements")) : null,
      managerComment: formData.get("managerComment") ? String(formData.get("managerComment")) : null,
    },
  });
  revalidatePath("/hrm/performance");
}

export async function deletePerformanceReview(id: number) {
  await requireUser();
  await prisma.hRMPerformance.delete({ where: { id } });
  revalidatePath("/hrm/performance");
}
