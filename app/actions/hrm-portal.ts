"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireEmployee() {
  const session = await auth();
  if (!session?.user || session.user.role !== "employee") redirect("/portal/login");
  return {
    employeeId: Number((session.user as any).employeeId),
    session,
  };
}

export async function portalApplyLeave(formData: FormData) {
  const { employeeId } = await requireEmployee();
  const leaveTypeId = Number(formData.get("leaveTypeId"));
  const startDate = new Date(String(formData.get("startDate")));
  const endDate = new Date(String(formData.get("endDate")));
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
  const reason = formData.get("reason") ? String(formData.get("reason")) : null;

  await prisma.hRMLeave.create({
    data: {
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      days,
      reason,
      status: "PENDING",
    },
  });
  revalidatePath("/portal/leaves");
  redirect("/portal/leaves");
}

export async function portalCancelLeave(id: number) {
  const { employeeId } = await requireEmployee();
  // Ensure the leave belongs to this employee
  const leave = await prisma.hRMLeave.findUnique({ where: { id } });
  if (!leave || leave.employeeId !== employeeId) return;
  if (leave.status !== "PENDING") return;
  await prisma.hRMLeave.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/portal/leaves");
  revalidatePath("/hrm/leaves");
}

export async function portalChangePassword(formData: FormData) {
  const { employeeId } = await requireEmployee();
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
  const bcrypt = await import("bcryptjs");
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.hRMEmployee.update({
    where: { id: employeeId },
    data: { portalPassword: hashed },
  });
  revalidatePath("/portal/profile");
}
