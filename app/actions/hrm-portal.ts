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

// Store PKT time "as UTC" — consistent with ZK machine convention
// ZK sends bare local-time strings; new Date() treats them as UTC, so PKT value = stored "UTC" value.
// Portal uses actual UTC clock, so we add +5h to match the ZK convention.
function pktNow() {
  return new Date(Date.now() + 5 * 3600000);
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
  const leave = await prisma.hRMLeave.findUnique({ where: { id } });
  if (!leave || leave.employeeId !== employeeId) return;
  if (leave.status !== "PENDING") return;
  await prisma.hRMLeave.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/portal/leaves");
  revalidatePath("/hrm/leaves");
}

export async function portalCheckIn() {
  const { employeeId } = await requireEmployee();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // UTC midnight — matches ZK date convention

  const existing = await prisma.hRMAttendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing) {
    if (!existing.checkIn) {
      await prisma.hRMAttendance.update({
        where: { id: existing.id },
        data: { checkIn: pktNow(), isManual: true, notes: "Manual check-in via employee portal" },
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

  const now = pktNow();
  // Late threshold: shift start + 30 min grace, in PKT-as-UTC
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await prisma.hRMAttendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (!record || !record.checkIn) return;

  // Use pktNow() so working hours calculation is consistent regardless of
  // whether check-in came from ZK machine (PKT-as-UTC) or portal (also PKT-as-UTC now)
  const now = pktNow();
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
