"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/scope";

async function requireEmployee() {
  const session = await auth();
  if (!session?.user || session.user.role !== "employee") redirect("/portal/login");
  return Number((session.user as any).employeeId);
}

export async function submitBankLetterRequest(formData: FormData) {
  const employeeId = await requireEmployee();
  const notes = formData.get("notes") ? String(formData.get("notes")) : null;

  // Block if pending request already exists
  const existing = await prisma.hRMBankLetterRequest.findFirst({
    where: { employeeId, status: "PENDING" },
  });
  if (existing) return { error: "You already have a pending request." };

  await prisma.hRMBankLetterRequest.create({ data: { employeeId, notes, status: "PENDING" } });
  revalidatePath("/portal/bank-letter");
  revalidatePath("/hrm/bank-letters");
}

export async function updateBankLetterStatus(id: number, status: string, hrNote?: string) {
  await requireUser();
  await prisma.hRMBankLetterRequest.update({
    where: { id },
    data: { status, hrNote: hrNote ?? null },
  });
  revalidatePath("/hrm/bank-letters");
  revalidatePath("/portal/bank-letter");
}
