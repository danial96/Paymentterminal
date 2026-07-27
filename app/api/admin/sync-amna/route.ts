import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getZKAttendanceLogs } from "@/lib/zkteco";

export async function POST() {
  const amna = await prisma.hRMEmployee.findFirst({
    where: { employeeId: "IKIA1039" },
  });
  if (!amna) return NextResponse.json({ error: "IKIA1039 not found" }, { status: 404 });

  const logs = await getZKAttendanceLogs();

  // Today in PKT
  const pktNow = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const todayStr = `${pktNow.getUTCFullYear()}-${String(pktNow.getUTCMonth() + 1).padStart(2, "0")}-${String(pktNow.getUTCDate()).padStart(2, "0")}`;

  // Find IKIA1039's punches today (ZK user_id may be numeric part)
  const zkId = "1039";
  const todayLogs = logs.filter((l) => {
    const matches = l.user_id === "IKIA1039" || l.user_id === zkId || l.user_id === "1039";
    if (!matches) return false;
    const ts = new Date(l.record_time);
    const pkt = new Date(ts.getTime() + 5 * 60 * 60 * 1000);
    const logDate = `${pkt.getUTCFullYear()}-${String(pkt.getUTCMonth() + 1).padStart(2, "0")}-${String(pkt.getUTCDate()).padStart(2, "0")}`;
    return logDate === todayStr;
  });

  if (!todayLogs.length) {
    return NextResponse.json({ found: false, message: "No ZK logs found for IKIA1039 today", allUserIds: [...new Set(logs.map(l => l.user_id))].slice(0, 30) });
  }

  // Earliest punch = check-in
  const checkInLog = todayLogs.reduce((a, b) => new Date(a.record_time) < new Date(b.record_time) ? a : b);
  const checkInUtc = new Date(checkInLog.record_time);
  // Convert to PKT naive for storage (consistent with rest of system)
  const checkInPkt = new Date(checkInUtc.getTime() + 5 * 60 * 60 * 1000);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rec = await prisma.hRMAttendance.findFirst({
    where: { employeeId: amna.id, date: { gte: today } },
  });

  if (rec) {
    await prisma.hRMAttendance.update({
      where: { id: rec.id },
      data: { checkIn: checkInPkt, isManual: false, status: "PRESENT", lateMinutes: null },
    });
  } else {
    await prisma.hRMAttendance.create({
      data: { employeeId: amna.id, date: today, checkIn: checkInPkt, isManual: false, status: "PRESENT" },
    });
  }

  return NextResponse.json({
    ok: true,
    zkTime: checkInUtc.toISOString(),
    storedAsPkt: checkInPkt.toISOString(),
    allTodayPunches: todayLogs.map(l => l.record_time),
  });
}
