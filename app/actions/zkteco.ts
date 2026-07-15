"use server";

import { requireAdmin } from "@/lib/scope";
import { getZKAttendanceLogs, getZKUsers, startFingerprintEnrollment } from "@/lib/zkteco";
import { prisma } from "@/lib/prisma";

export async function debugZKLogs() {
  await requireAdmin();
  const logs = await getZKAttendanceLogs();
  // Return first 5 raw logs to inspect structure
  return logs.slice(0, 5).map((l) => JSON.stringify(l));
}

export async function syncZKAttendance() {
  await requireAdmin();

  const logs = await getZKAttendanceLogs();
  if (!logs.length) return { synced: 0, skipped: 0, errors: [] as string[] };

  // Get all employees with their ZK user ID mapping (employeeId field = ZK userId)
  const employees = await prisma.hRMEmployee.findMany({
    where: { deletedAt: null },
    select: { id: true, employeeId: true },
  });

  const empMap = new Map<string, number>();
  for (const e of employees) {
    empMap.set(e.employeeId, e.id);
    // Also map numeric part — machine stores attendance as numeric uid (e.g. 1014 for EMP1014)
    const numericId = e.employeeId.replace(/^EMP/i, "");
    if (numericId !== e.employeeId) empMap.set(numericId, e.id);
  }

  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const log of logs) {
    const employeeDbId = empMap.get(log.user_id);
    if (!employeeDbId) {
      skipped++;
      continue;
    }

    const date = new Date(log.record_time);
    const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    try {
      const existing = await prisma.hRMAttendance.findUnique({
        where: { employeeId_date: { employeeId: employeeDbId, date: dateOnly } },
      });

      // state: 0 = check-in, 1 = check-out
      if (!existing) {
        // First record of the day — set as check-in
        const lateThreshold = new Date(dateOnly);
        lateThreshold.setUTCHours(9, 15, 0, 0);
        const isLate = date > lateThreshold;

        await prisma.hRMAttendance.create({
          data: {
            employeeId: employeeDbId,
            date: dateOnly,
            checkIn: date,
            status: isLate ? "LATE" : "PRESENT",
            isManual: false,
          },
        });
        // Mark fingerprint as enrolled on first attendance
        await prisma.hRMEmployee.updateMany({
          where: { id: employeeDbId, fingerprintEnrolled: false },
          data: { fingerprintEnrolled: true },
        });
        synced++;
      } else if (log.state === 1 || (!existing.checkOut && date > new Date(dateOnly.getTime() + 8 * 3600000))) {
        // Update check-out if not set or explicitly check-out event
        if (!existing.checkOut) {
          const checkInDate = existing.checkIn ? new Date(existing.checkIn) : date;
          const workMs = date.getTime() - checkInDate.getTime();
          const workHours = Math.round((workMs / 3600000) * 100) / 100;
          const overtime = workHours > 8 ? Math.round((workHours - 8) * 100) / 100 : 0;

          await prisma.hRMAttendance.update({
            where: { id: existing.id },
            data: {
              checkOut: date,
              workingHours: workHours,
              overtimeHours: overtime,
            },
          });
          // Mark enrolled on checkout sync too
          await prisma.hRMEmployee.updateMany({
            where: { id: employeeDbId, fingerprintEnrolled: false },
            data: { fingerprintEnrolled: true },
          });
          synced++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    } catch (e) {
      errors.push(`Employee ${log.user_id}: ${e}`);
    }
  }

  return { synced, skipped, errors };
}

export async function getZKDeviceUsers() {
  await requireAdmin();
  return await getZKUsers();
}

export async function startEnrollment(employeeId: string) {
  await requireAdmin();
  // Extract numeric UID from employeeId e.g. EMP1001 -> 1001
  const uid = parseInt(employeeId.replace("EMP", ""));
  if (isNaN(uid)) throw new Error("Invalid employeeId format");
  await startFingerprintEnrollment(uid);
  return { success: true };
}

export async function getPendingFingerprintEmployees() {
  await requireAdmin();
  return await prisma.hRMEmployee.findMany({
    where: { fingerprintEnrolled: false, deletedAt: null, status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, employeeId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}
