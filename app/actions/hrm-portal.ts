"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { todayWorkDate } from "@/lib/attendance-utils";

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
    data: { employeeId, leaveTypeId, startDate, endDate, days, reason, status: "PENDING" },
  });
  revalidatePath("/portal/leaves");
  redirect("/portal/leaves");
}

export async function portalCancelLeave(id: number) {
  const { employeeId } = await requireEmployee();
  const leave = await prisma.hRMLeave.findUnique({ where: { id } });
  if (!leave || leave.employeeId !== employeeId) return;
  if (leave.status !== "PENDING") return;
  await prisma.hRMLeave.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/portal/leaves");
  revalidatePath("/hrm/leaves");
}

export async function portalCheckIn() {
  const { employeeId } = await requireEmployee();
  const today = todayWorkDate(); // PKT work day (3 AM boundary)

  const existing = await prisma.hRMAttendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing) {
    // Already has a record — add checkIn if missing, otherwise ignore (second tap = no-op)
    if (!existing.checkIn) {
      await prisma.hRMAttendance.update({
        where: { id: existing.id },
        data: { checkIn: new Date(), isManual: true, notes: "Manual check-in via employee portal" },
      });
    }
    revalidatePath("/portal/dashboard");
    revalidatePath("/hrm/attendance");
    return;
  }

  // Fetch employee shift for accurate late threshold
  const emp = await prisma.hRMEmployee.findUnique({
    where: { id: employeeId },
    select: { shift: { select: { startTime: true } } },
  });
  const shiftStart = emp?.shift?.startTime ?? "14:00"; // default 2 PM PKT
  const [shiftH, shiftM] = shiftStart.split(":").map(Number);

  const now = new Date(); // actual UTC
  // Late threshold: shift start + 30 min grace, converted PKT→UTC (subtract 5h)
  const lateThreshold = new Date(today);
  lateThreshold.setUTCHours(shiftH - 5, shiftM + 30, 0, 0);

  const isLate = now > lateThreshold;
  const lateMinutes = isLate ? Math.floor((now.getTime() - lateThreshold.getTime()) / 60000) : 0;

  await prisma.hRMAttendance.create({
    data: {
      employeeId,
      date: today,
      checkIn: now,
      status: isLate ? "LATE" : "PRESENT",
      lateMinutes: lateMinutes > 0 ? lateMinutes : null,
      isManual: true,
      notes: "Manual check-in via employee portal",
    },
  });
  revalidatePath("/portal/dashboard");
  revalidatePath("/hrm/attendance");
}

export async function portalCheckOut() {
  const { employeeId } = await requireEmployee();
  // Work day date: checkout at 1-2 AM PKT still belongs to previous day's record
  const today = todayWorkDate();

  const record = await prisma.hRMAttendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (!record || !record.checkIn) return;

  const now = new Date(); // actual UTC — consistent with ZK records
  const breakMins = record.breakStart && record.breakEnd
    ? (record.breakEnd.getTime() - record.breakStart.getTime()) / 60000
    : 0;
  const totalMins = (now.getTime() - record.checkIn.getTime()) / 60000 - breakMins;
  const workingHours = Math.max(0, totalMins / 60);
  const overtimeHours = Math.max(0, workingHours - 8);

  await prisma.hRMAttendance.update({
    where: { id: record.id },
    data: {
      checkOut: now,
      workingHours: Number(workingHours.toFixed(2)),
      overtimeHours: overtimeHours > 0 ? Number(overtimeHours.toFixed(2)) : null,
      isManual: true,
      notes: record.notes
        ? record.notes.replace("check-in", "check-in & check-out")
        : "Manual check-out via employee portal",
    },
  });
  revalidatePath("/portal/dashboard");
  revalidatePath("/hrm/attendance");
}

export async function portalSubmitComplaint(formData: FormData) {
  const { employeeId } = await requireEmployee();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = formData.get("category") ? String(formData.get("category")) : null;
  if (!title || !description) return;
  await (prisma as any).hRMComplaint.create({
    data: { employeeId, title, description, category, status: "PENDING" },
  });
  revalidatePath("/portal/complaints");
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
