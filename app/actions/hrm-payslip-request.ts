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
  const toMonth = formData.get("toMonth") ? Number(formData.get("toMonth")) : null;
  const toYear = formData.get("toYear") ? Number(formData.get("toYear")) : null;

  // Avoid duplicate pending requests for the same from-period
  const existing = await prisma.hRMPayslipRequest.findFirst({
    where: { employeeId, month, year, status: "PENDING" },
  });
  if (existing) return { error: "A pending request already exists for this period." };

  await prisma.hRMPayslipRequest.create({
    data: { employeeId, month, year, toMonth, toYear, status: "PENDING" },
  });
  revalidatePath("/portal/payslip-request");
  return { success: true };
}

export async function fulfillPayslipRequest(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  const hrNote = (formData.get("hrNote") as string | null) ?? null;
  await prisma.hRMPayslipRequest.update({
    where: { id },
    data: { status: "FULFILLED", hrNote: hrNote || null },
  });
  revalidatePath("/hrm/payroll/requests");
  revalidatePath("/portal/payslip-request");
  revalidatePath("/portal/dashboard");
}

export async function rejectPayslipRequest(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  const hrNote = (formData.get("hrNote") as string | null) ?? null;
  await prisma.hRMPayslipRequest.update({
    where: { id },
    data: { status: "REJECTED", hrNote: hrNote || null },
  });
  revalidatePath("/hrm/payroll/requests");
  revalidatePath("/portal/payslip-request");
  revalidatePath("/portal/dashboard");
}
