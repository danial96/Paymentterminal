"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/scope";
import { redirect } from "next/navigation";

async function requireEmployee() {
  const session = await auth();
  if (!session?.user || session.user.role !== "employee") redirect("/portal/login");
  return Number((session.user as any).employeeId);
}

export async function requestPayslip(formData: FormData) {
  const employeeId = await requireEmployee();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));

  // Avoid duplicate pending requests
  const existing = await prisma.hRMPayslipRequest.findFirst({
    where: { employeeId, month, year, status: "PENDING" },
  });
  if (existing) return { error: "A pending request already exists for this month." };

  await prisma.hRMPayslipRequest.create({
    data: { employeeId, month, year, status: "PENDING" },
  });
  revalidatePath("/portal/payslip-request");
  return { success: true };
}

export async function fulfillPayslipRequest(id: number, hrNote?: string) {
  await requireUser();
  await prisma.hRMPayslipRequest.update({
    where: { id },
    data: { status: "FULFILLED", hrNote: hrNote ?? null },
  });
  revalidatePath("/hrm/payroll/requests");
}

export async function rejectPayslipRequest(id: number, hrNote?: string) {
  await requireUser();
  await prisma.hRMPayslipRequest.update({
    where: { id },
    data: { status: "REJECTED", hrNote: hrNote ?? null },
  });
  revalidatePath("/hrm/payroll/requests");
}
