"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";
import { todayWorkDate } from "@/lib/attendance-utils";

export async function checkIn(employeeId: number) {
  await requireUser();
  const today = todayWorkDate();
  const existing = await prisma.hRMAttendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (existing) {
    if (!existing.checkIn) {
      await prisma.hRMAttendance.update({
        where: { id: existing.id },
        data: { checkIn: new Date(), status: "PRESENT" },
      });
    }
    return;
  }

  // Fetch employee shift for accurate late threshold
  const emp = await prisma.hRMEmployee.findUnique({
    where: { id: employeeId },
    select: { shift: { select: { startTime: true } } },
  });
  const shiftStart = emp?.shift?.startTime ?? "14:00"; // default 2 PM PKT
  const [shiftH, shiftM] = shiftStart.split(":").map(Number);

  const now = new Date();
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
    },
  });
  revalidatePath("/hrm/attendance");
  revalidatePath("/hrm/self-service");
}

export async function checkOut(employeeId: number) {
  await requireUser();
  const today = todayWorkDate();
  const record = await prisma.hRMAttendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (!record || !record.checkIn) return;

  const now = new Date();
  const checkInTime = record.checkIn;
  const breakMins = record.breakStart && record.breakEnd
    ? (record.breakEnd.getTime() - record.breakStart.getTime()) / 60000
    : 0;
  const totalMins = (now.getTime() - checkInTime.getTime()) / 60000 - breakMins;
  const workingHours = Math.max(0, totalMins / 60);
  const overtimeHours = Math.max(0, workingHours - 8);

  await prisma.hRMAttendance.update({
    where: { id: record.id },
    data: {
      checkOut: now,
      workingHours: Number(workingHours.toFixed(2)),
      overtimeHours: overtimeHours > 0 ? Number(overtimeHours.toFixed(2)) : null,
    },
  });
  revalidatePath("/hrm/attendance");
  revalidatePath("/hrm/self-service");
}

export async function breakStart(employeeId: number) {
  await requireUser();
  const today = todayWorkDate();
  const record = await prisma.hRMAttendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (!record) return;
  await prisma.hRMAttendance.update({
    where: { id: record.id },
    data: { breakStart: new Date() },
  });
  revalidatePath("/hrm/self-service");
}

export async function breakEnd(employeeId: number) {
  await requireUser();
  const today = todayWorkDate();
  const record = await prisma.hRMAttendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (!record) return;
  await prisma.hRMAttendance.update({
    where: { id: record.id },
    data: { breakEnd: new Date() },
  });
  revalidatePath("/hrm/self-service");
}

const ManualSchema = z.object({
  employeeId: z.number(),
  date: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "EARLY_LEAVE", "ON_LEAVE", "HOLIDAY", "WEEKLY_OFF"]),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().optional(),
});

export async function saveManualAttendance(formData: FormData) {
  await requireUser();
  const dateStr = String(formData.get("date") ?? "");
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const employeeId = Number(formData.get("employeeId"));
  const status = String(formData.get("status") ?? "PRESENT") as "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "EARLY_LEAVE" | "ON_LEAVE" | "HOLIDAY" | "WEEKLY_OFF";
  const checkInStr = formData.get("checkIn") ? String(formData.get("checkIn")) : null;
  const checkOutStr = formData.get("checkOut") ? String(formData.get("checkOut")) : null;
  const notes = formData.get("notes") ? String(formData.get("notes")) : null;

  const toDateTime = (dateStr: string, timeStr: string) => {
    const d = new Date(dateStr);
    const [h, m] = timeStr.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const checkIn = checkInStr ? toDateTime(dateStr, checkInStr) : null;
  const checkOut = checkOutStr ? toDateTime(dateStr, checkOutStr) : null;
  let workingHours = null;
  if (checkIn && checkOut) {
    workingHours = Number(((checkOut.getTime() - checkIn.getTime()) / 3600000).toFixed(2));
  }

  await prisma.hRMAttendance.upsert({
    where: { employeeId_date: { employeeId, date } },
    create: { employeeId, date, status, checkIn, checkOut, workingHours, notes, isManual: true },
    update: { status, checkIn, checkOut, workingHours, notes, isManual: true },
  });
  revalidatePath("/hrm/attendance");
}
