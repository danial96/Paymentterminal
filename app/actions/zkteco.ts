"use server";

import { requireAdmin, requireUser } from "@/lib/scope";
import { getZKAttendanceLogs, getZKUsers, getZKFingerStatus, startFingerprintEnrollment, pushUserToZK, deleteZKUser } from "@/lib/zkteco";
import { prisma } from "@/lib/prisma";

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

  // Build employee map
  const employees = await prisma.hRMEmployee.findMany({
    where: { deletedAt: null },
    select: { id: true, employeeId: true },
  });
  const empMap = new Map<string, number>();
  for (const e of employees) {
    empMap.set(e.employeeId, e.id);
    const numericId = e.employeeId.replace(/^IKIA|^EMP/i, "").replace("-", "");
    if (numericId !== e.employeeId) empMap.set(numericId, e.id);
  }

  // Group by employee+date. Use punch type: 0=check-in, 1=check-out.
  // If machine has separate buttons, use typed punches. Fallback: first punch=in, last punch=out.
  type DayEntry = { empId: number; date: Date; checkIns: Date[]; checkOuts: Date[] };
  const dayMap = new Map<string, DayEntry>();

  for (const log of logs) {
    const empId = empMap.get(log.user_id);
    if (!empId) continue;
    const ts = new Date(log.record_time);
    const dateOnly = new Date(Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()));
    const key = `${empId}_${dateOnly.getTime()}`;
    if (!dayMap.has(key)) dayMap.set(key, { empId, date: dateOnly, checkIns: [], checkOuts: [] });
    const entry = dayMap.get(key)!;
    // state = in/out direction: 0=check-in, 1=check-out (byte 31 in ZKTeco protocol)
    // type = verification method (fingerprint/card) — NOT the punch direction
    if (log.state === 1) {
      entry.checkOuts.push(ts);
    } else {
      entry.checkIns.push(ts);
    }
  }

  if (!dayMap.size) return { synced: 0, skipped: logs.length, errors: [] };

  // Fetch all existing attendance records for these employee+date combos in one query
  const empIds = [...new Set([...dayMap.values()].map((d) => d.empId))];
  const existing = await prisma.hRMAttendance.findMany({
    where: { employeeId: { in: empIds }, isManual: false },
    select: { id: true, employeeId: true, date: true, checkIn: true, checkOut: true },
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
  const toUpdate: { id: number; checkOut: Date; workingHours: number; overtimeHours: number }[] = [];

  for (const [key, entry] of dayMap) {
    const rec = existingMap.get(key);
    const lateThreshold = new Date(entry.date);
    lateThreshold.setUTCHours(9, 15, 0, 0);

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
      toCreate.push({
        employeeId: entry.empId,
        date: entry.date,
        checkIn: checkIn!,
        checkOut: effectiveCheckOut,
        status: checkIn! > lateThreshold ? "LATE" : "PRESENT",
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
      const workMs = validCheckout.getTime() - checkInDate!.getTime();
      const wh = Math.round((workMs / 3600000) * 100) / 100;
      toUpdate.push({ id: rec.id, checkOut: validCheckout, workingHours: wh, overtimeHours: wh > 8 ? Math.round((wh - 8) * 100) / 100 : 0 });
      enrollIds.add(entry.empId);
      synced++;
    } else {
      skipped++;
    }
  }

  // Batch writes
  try {
    if (toCreate.length) await prisma.hRMAttendance.createMany({ data: toCreate, skipDuplicates: true });
    await Promise.all(toUpdate.map((u) => prisma.hRMAttendance.update({ where: { id: u.id }, data: { checkOut: u.checkOut, workingHours: u.workingHours, overtimeHours: u.overtimeHours } })));
    if (enrollIds.size) await prisma.hRMEmployee.updateMany({ where: { id: { in: [...enrollIds] }, fingerprintEnrolled: false }, data: { fingerprintEnrolled: true } });
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
