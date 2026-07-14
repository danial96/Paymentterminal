"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

const LeaveTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  daysAllowed: z.number().int().min(0),
  isPaid: z.boolean().default(true),
  carryForward: z.boolean().default(false),
  description: z.string().optional(),
});

export async function createLeaveType(formData: FormData) {
  await requireUser();
  await prisma.hRMLeaveType.create({
    data: {
      name: String(formData.get("name") ?? ""),
      code: String(formData.get("code") ?? "").toUpperCase(),
      daysAllowed: Number(formData.get("daysAllowed") ?? 0),
      isPaid: formData.get("isPaid") !== "false",
      carryForward: formData.get("carryForward") === "true",
      description: formData.get("description") ? String(formData.get("description")) : null,
    },
  });
  revalidatePath("/hrm/leaves/types");
}

export async function updateLeaveType(id: number, formData: FormData) {
  await requireUser();
  await prisma.hRMLeaveType.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? ""),
      daysAllowed: Number(formData.get("daysAllowed") ?? 0),
      isPaid: formData.get("isPaid") !== "false",
      carryForward: formData.get("carryForward") === "true",
      description: formData.get("description") ? String(formData.get("description")) : null,
    },
  });
  revalidatePath("/hrm/leaves/types");
}

export async function deleteLeaveType(id: number) {
  await requireUser();
  await prisma.hRMLeaveType.delete({ where: { id } });
  revalidatePath("/hrm/leaves/types");
}

export async function applyLeave(formData: FormData) {
  await requireUser();
  const employeeId = Number(formData.get("employeeId"));
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
  revalidatePath("/hrm/leaves");
  revalidatePath("/hrm/self-service/leaves");
}

export async function approveLeave(id: number, approverId: number) {
  await requireUser();
  const leave = await prisma.hRMLeave.findUnique({ where: { id }, include: { leaveType: true } });
  if (!leave) return;

  await prisma.hRMLeave.update({
    where: { id },
    data: { status: "APPROVED", approvedById: approverId, approvedAt: new Date() },
  });

  // Update leave balance
  const year = leave.startDate.getFullYear();
  await prisma.hRMLeaveBalance.upsert({
    where: { employeeId_leaveTypeId_year: { employeeId: leave.employeeId, leaveTypeId: leave.leaveTypeId, year } },
    create: {
      employeeId: leave.employeeId,
      leaveTypeId: leave.leaveTypeId,
      year,
      allocated: leave.leaveType.daysAllowed,
      used: leave.days,
      remaining: Math.max(0, leave.leaveType.daysAllowed - leave.days),
    },
    update: {
      used: { increment: leave.days },
      remaining: { decrement: leave.days },
    },
  });

  // Mark attendance as ON_LEAVE for each day
  const current = new Date(leave.startDate);
  while (current <= leave.endDate) {
    const d = new Date(current);
    d.setHours(0, 0, 0, 0);
    await prisma.hRMAttendance.upsert({
      where: { employeeId_date: { employeeId: leave.employeeId, date: d } },
      create: { employeeId: leave.employeeId, date: d, status: "ON_LEAVE", isManual: true },
      update: { status: "ON_LEAVE" },
    });
    current.setDate(current.getDate() + 1);
  }

  revalidatePath("/hrm/leaves");
}

export async function rejectLeave(id: number, reason: string) {
  await requireUser();
  await prisma.hRMLeave.update({
    where: { id },
    data: { status: "REJECTED", rejectedReason: reason },
  });
  revalidatePath("/hrm/leaves");
}

export async function cancelLeave(id: number) {
  await requireUser();
  await prisma.hRMLeave.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/hrm/leaves");
  revalidatePath("/hrm/self-service/leaves");
}
