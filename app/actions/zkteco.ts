"use server";

import { requireAdmin, requireUser } from "@/lib/scope";
import { getZKAttendanceLogs, getZKUsers, getZKFingerStatus, startFingerprintEnrollment, pushUserToZK, deleteZKUser } from "@/lib/zkteco";
import { prisma } from "@/lib/prisma";
import { workDayDate, todayWorkDate } from "@/lib/attendance-utils";


export async function debugZKLogs() {
  await requireAdmin();
  const logs = await getZKAttendanceLogs();
  // Return last 10 raw logs to see recent punches
  return logs.slice(-10).map((l) => JSON.stringify(l));
}

export async function syncZKAttendance() {
  await requireUser();

  const logs = await getZKAttendanceLogs();
  if (!logs.length) return { synced: 0, skipped: 0, errors: [] as string[] };

  // Build employee map (include shift for late/early-leave calculation)
  const employees = await prisma.hRMEmployee.findMany({
    where: { deletedAt: null },
    select: { id: true, employeeId: true, shift: { select: { startTime: true, endTime: true } } },
  });
  const empMap = new Map<string, number>();
  type ShiftInfo = { startTime: string; endTime: string };
  const empShiftMap = new Map<number, ShiftInfo>(); // empId → shift times (PKT)
  // Default shift: 14:00–23:00 (2 PM – 11 PM PKT)
  const DEFAULT_SHIFT: ShiftInfo = { startTime: "14:00", endTime: "23:00" };
  for (const e of employees) {
    empMap.set(e.employeeId, e.id);
    const numericId = e.employeeId.replace(/^IKIA|^EMP/i, "").replace("-", "");
    if (numericId !== e.employeeId) empMap.set(numericId, e.id);
    empShiftMap.set(e.id, e.shift ? { startTime: e.shift.startTime, endTime: e.shift.endTime } : DEFAULT_SHIFT);
  }

  // Group by employee+date. Use punch type: 0=check-in, 1=check-out.
  // If machine has separate buttons, use typed punches. Fallback: first punch=in, last punch=out.
  type DayEntry = { empId: number; date: Date; checkIns: Date[]; checkOuts: Date[] };
  const dayMap = new Map<string, DayEntry>();

  for (const log of logs) {
    const empId = empMap.get(log.user_id);
    if (!empId) continue;
    const ts = new Date(log.record_time);
    // Work day changes at 3 AM PKT: punches before 3 AM belong to the previous calendar day
    const dateOnly = workDayDate(ts);
    const key = `${empId}_${dateOnly.getTime()}`;
    if (!dayMap.has(key)) dayMap.set(key, { empId, date: dateOnly, checkIns: [], checkOuts: [] });
    const entry = dayMap.get(key)!;
    // Empirically confirmed: state=0 = check-IN, state=1 = check-OUT
    // (verified by physical checkout test: machine recorded state=1)
    if (log.state === 1) {
      entry.checkOuts.push(ts);
    } else {
      entry.checkIns.push(ts);
    }
  }

  if (!dayMap.size) return { synced: 0, skipped: logs.length, errors: [] };

  // Fetch all existing attendance records for these employee+date combos in one query
  const empIds = [...new Set([...dayMap.values()].map((d) => d.empId))];
  // Fetch ALL records (manual + biometric) so ZK checkout can update manual check-in records too
  const existing = await prisma.hRMAttendance.findMany({
    where: { employeeId: { in: empIds } },
    select: { id: true, employeeId: true, date: true, checkIn: true, checkOut: true, status: true },
  });
  const existingMap = new Map<string, typeof existing[0]>();
  for (const rec of existing) {
    existingMap.set(`${rec.employeeId}_${rec.date.getTime()}`, rec);
  }

  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];
  const enrollIds = new Set<number>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toCreate: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toUpdate: { id: number; checkOut: Date; workingHours: number; overtimeHours: number; status?: any }[] = [];

  for (const [key, entry] of dayMap) {
    const rec = existingMap.get(key);

    // Shift-based thresholds — shift times are PKT; convert to UTC offset in minutes from day start
    const shift = empShiftMap.get(entry.empId) ?? DEFAULT_SHIFT;
    const [shiftH, shiftM] = shift.startTime.split(":").map(Number);
    const [endH, endM] = shift.endTime.split(":").map(Number);
    const startUtcMins = (shiftH - 5) * 60 + shiftM;           // PKT→UTC: subtract 5h
    const endUtcMins   = (endH   - 5) * 60 + endM;
    // Overnight shift: end ≤ start in PKT (e.g. 15:00→00:00), end is next day → add 1440 min
    const effectiveEndUtcMins = endUtcMins <= startUtcMins ? endUtcMins + 1440 : endUtcMins;

    // LATE threshold: shift start + 30 min grace
    const lateThreshold = new Date(entry.date.getTime() + (startUtcMins + 30) * 60000);

    // HALF_DAY threshold: shift start + 4 hours
    const halfDayThreshold = new Date(entry.date.getTime() + (startUtcMins + 4 * 60) * 60000);

    // EARLY_LEAVE threshold: shift end - 30 min grace
    const earlyLeaveThreshold = new Date(entry.date.getTime() + (effectiveEndUtcMins - 30) * 60000);

    // Use punch type strictly: type=0 → check-in, type=1 → check-out
    const checkIn = entry.checkIns.length > 0
      ? entry.checkIns.reduce((a, b) => a < b ? a : b)  // earliest check-in punch
      : null;
    const checkOut = entry.checkOuts.length > 0
      ? entry.checkOuts.reduce((a, b) => a > b ? a : b)  // latest check-out punch
      : null;
    const effectiveCheckOut = checkOut && checkIn && checkOut > checkIn ? checkOut : null;

    if (!checkIn && !checkOut) { skipped++; continue; }

    if (!rec) {
      // Only checkout punch (no check-in): update existing record's checkout if exists, else skip
      if (!checkIn && effectiveCheckOut === null && checkOut) {
        // Will be handled below as an update if record exists
        skipped++;
        continue;
      }
      const checkInStatus = checkIn! >= halfDayThreshold ? "HALF_DAY" : checkIn! > lateThreshold ? "LATE" : "PRESENT";
      const isEarlyLeave = effectiveCheckOut && effectiveCheckOut < earlyLeaveThreshold;
      const status = isEarlyLeave && checkInStatus === "PRESENT" ? "EARLY_LEAVE" : checkInStatus;
      const lateMinutes = checkInStatus === "LATE" || checkInStatus === "HALF_DAY"
        ? Math.round((checkIn!.getTime() - lateThreshold.getTime()) / 60000)
        : 0;
      toCreate.push({
        employeeId: entry.empId,
        date: entry.date,
        checkIn: checkIn!,
        checkOut: effectiveCheckOut,
        status,
        lateMinutes,
        isManual: false,
        ...(effectiveCheckOut ? (() => {
          const workMs = effectiveCheckOut.getTime() - checkIn!.getTime();
          const wh = Math.round((workMs / 3600000) * 100) / 100;
          return { workingHours: wh, overtimeHours: wh > 8 ? Math.round((wh - 8) * 100) / 100 : 0 };
        })() : {}),
      });
      enrollIds.add(entry.empId);
      synced++;
    } else if (checkOut && !rec.checkOut) {
      // Update checkout on existing record
      const checkInDate = rec.checkIn ? new Date(rec.checkIn) : null;
      const validCheckout = checkInDate && checkOut > checkInDate ? checkOut : null;
      if (!validCheckout) { skipped++; continue; }
      // Ignore punches within 60 min of check-in — likely accidental/check-in direction tap
      const minsSinceCheckIn = (validCheckout.getTime() - checkInDate!.getTime()) / 60000;
      if (minsSinceCheckIn < 60) { skipped++; continue; }
      const workMs = validCheckout.getTime() - checkInDate!.getTime();
      const wh = Math.round((workMs / 3600000) * 100) / 100;
      // Update status to EARLY_LEAVE if PRESENT and left early
      const isEarlyLeave = validCheckout < earlyLeaveThreshold;
      const updatedStatus = isEarlyLeave && rec.status === "PRESENT" ? "EARLY_LEAVE" : undefined;
      toUpdate.push({ id: rec.id, checkOut: validCheckout, workingHours: wh, overtimeHours: wh > 8 ? Math.round((wh - 8) * 100) / 100 : 0, ...(updatedStatus ? { status: updatedStatus } : {}) });
      enrollIds.add(entry.empId);
      synced++;
    } else {
      skipped++;
    }
  }

  // Batch writes
  try {
    if (toCreate.length) await prisma.hRMAttendance.createMany({ data: toCreate, skipDuplicates: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Promise.all(toUpdate.map((u) => prisma.hRMAttendance.update({ where: { id: u.id }, data: { checkOut: u.checkOut, workingHours: u.workingHours, overtimeHours: u.overtimeHours, ...(u.status ? { status: u.status } : {}) } as any })));
    if (enrollIds.size) await prisma.hRMEmployee.updateMany({ where: { id: { in: [...enrollIds] }, fingerprintEnrolled: false }, data: { fingerprintEnrolled: true } });

    // Flag missed checkouts: records with checkIn but no checkOut from a previous work day
    // (3 AM PKT = new work day starts; anyone without checkout after that is "missed")
    const todayWork = todayWorkDate();
    await prisma.hRMAttendance.updateMany({
      where: {
        employeeId: { in: empIds },
        date: { lt: todayWork },
        checkIn: { not: null },
        checkOut: null,
        notes: { not: { contains: "Missed checkout" } },
      },
      data: { notes: "Missed checkout — auto flagged at next sync" },
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/portal/dashboard");
    revalidatePath("/portal/attendance");
    revalidatePath("/hrm/attendance");
  } catch (e) {
    errors.push(String(e));
  }

  return { synced, skipped, errors };
}

export async function getZKDeviceUsers() {
  await requireAdmin();
  return await getZKUsers();
}

export async function startEnrollment(employeeId: string) {
  await requireUser();
  try {
    const uid = parseInt(employeeId.replace(/^IKIA|^EMP/i, "").replace("-", ""));
    if (isNaN(uid)) return { error: "Invalid employee ID format" };
    const emp = await prisma.hRMEmployee.findFirst({ where: { employeeId }, select: { firstName: true, lastName: true } });
    const name = emp ? `${emp.firstName} ${emp.lastName}` : employeeId;
    await startFingerprintEnrollment(uid, name, employeeId);
    return { success: true };
  } catch {
    return { error: "Could not connect to fingerprint machine" };
  }
}

export async function deleteFingerprint(employeeId: string, dbId: number) {
  await requireUser();
  const uid = parseInt(employeeId.replace(/^IKIA|^EMP/i, "").replace("-", ""));
  if (isNaN(uid)) return { error: "Invalid employee ID" };
  try {
    // Delete from ZKTeco then re-push user without fingerprint
    await deleteZKUser(uid);
    const emp = await prisma.hRMEmployee.findUnique({ where: { id: dbId }, select: { firstName: true, lastName: true, employeeId: true } });
    if (emp) await pushUserToZK(uid, emp.employeeId, `${emp.firstName} ${emp.lastName}`);
    await prisma.hRMEmployee.update({ where: { id: dbId }, data: { fingerprintEnrolled: false } });
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/hrm/employees/${dbId}`);
    return { success: true };
  } catch (e: any) {
    return { error: e?.message ?? "Failed to delete fingerprint" };
  }
}

export async function reEnrollFingerprint(employeeId: string) {
  await requireUser();
  try {
    const uid = parseInt(employeeId.replace(/^IKIA|^EMP/i, "").replace("-", ""));
    if (isNaN(uid)) return { error: "Invalid employee ID format" };
    const emp = await prisma.hRMEmployee.findFirst({ where: { employeeId }, select: { firstName: true, lastName: true } });
    const name = emp ? `${emp.firstName} ${emp.lastName}` : employeeId;
    await startFingerprintEnrollment(uid, name, employeeId);
    return { success: true };
  } catch {
    return { error: "Could not connect to fingerprint machine" };
  }
}

export async function confirmEnrollment(employeeId: string, dbId: number) {
  await requireUser();
  try {
    const ADMIN_UID = 343;
    const users = await getZKUsers();

    // Find corrupt user (non-IKIA, non-numeric, non-admin)
    const corruptUser = users.find(
      (u) => u.uid !== ADMIN_UID && !u.userId?.startsWith("IKIA") && !u.userId?.match(/^\d+$/)
    );
    if (!corruptUser) {
      // Maybe machine used correct UID — check if employeeId already on machine
      const alreadyCorrect = users.find((u) => u.userId === employeeId);
      if (alreadyCorrect) {
        await prisma.hRMEmployee.update({ where: { id: dbId }, data: { fingerprintEnrolled: true } });
        const { revalidatePath } = await import("next/cache");
        revalidatePath(`/hrm/employees/${dbId}`);
        return { success: true };
      }
      return { error: "Fingerprint not detected on machine yet. Place finger 3 times and try again." };
    }

    // Fix corrupt userId → correct IKIA ID
    const emp = await prisma.hRMEmployee.findUnique({ where: { id: dbId }, select: { firstName: true, lastName: true, employeeId: true } });
    const name = emp ? `${emp.firstName} ${emp.lastName}`.slice(0, 24) : employeeId;
    await pushUserToZK(corruptUser.uid, employeeId, name);

    // Mark enrolled in DB
    await prisma.hRMEmployee.update({ where: { id: dbId }, data: { fingerprintEnrolled: true } });
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/hrm/employees/${dbId}`);
    return { success: true };
  } catch (e: any) {
    return { error: e?.message ?? "Could not confirm enrollment" };
  }
}

export async function getPendingFingerprintEmployees() {
  await requireAdmin();
  return await prisma.hRMEmployee.findMany({
    where: { fingerprintEnrolled: false, deletedAt: null, status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, employeeId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function syncFingerprintStatus() {
  await requireAdmin();
  try {
    // Get all users registered on machine
    const machineUsers = await getZKUsers();
    const machineUserIds = new Set(
      machineUsers.filter((u) => u.userId && u.userId.startsWith("IKIA")).map((u) => u.userId)
    );

    // Mark enrolled=true for everyone in machine (user record = enrolled via portal)
    // Mark enrolled=false ONLY for those not in machine at all
    const allEmps = await prisma.hRMEmployee.findMany({
      where: { deletedAt: null },
      select: { employeeId: true, fingerprintEnrolled: true },
    });

    const toEnroll = allEmps
      .filter((e) => machineUserIds.has(e.employeeId) && !e.fingerprintEnrolled)
      .map((e) => e.employeeId);

    const toUnenroll = allEmps
      .filter((e) => !machineUserIds.has(e.employeeId) && e.fingerprintEnrolled)
      .map((e) => e.employeeId);

    if (toEnroll.length) {
      await prisma.hRMEmployee.updateMany({
        where: { employeeId: { in: toEnroll } },
        data: { fingerprintEnrolled: true },
      });
    }
    if (toUnenroll.length) {
      await prisma.hRMEmployee.updateMany({
        where: { employeeId: { in: toUnenroll } },
        data: { fingerprintEnrolled: false },
      });
    }

    const enrolled = allEmps.filter((e) => machineUserIds.has(e.employeeId)).length;
    const notEnrolled = allEmps.filter((e) => !machineUserIds.has(e.employeeId)).length;

    await (prisma as any).zKSyncLog.create({
      data: { enrolled, notEnrolled, source: "node" },
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/hrm/employees");

    return { success: true, enrolled, notEnrolled };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getLastZKSync() {
  try {
    return await (prisma as any).zKSyncLog.findFirst({ orderBy: { syncedAt: "desc" } });
  } catch {
    return null;
  }
}

export async function updateComplaintStatus(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  const hrNote = String(formData.get("hrNote") ?? "").trim() || null;
  await (prisma as any).hRMComplaint.update({ where: { id }, data: { status, hrNote } });
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/hrm/complaints");
}
