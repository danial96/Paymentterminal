import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getZKAttendanceLogs } from "@/lib/zkteco";

export async function POST() {
  const amna = await prisma.hRMEmployee.findFirst({ where: { employeeId: "IKIA1039" } });
  if (!amna) return NextResponse.json({ error: "IKIA1039 not found" }, { status: 404 });

  const logs = await getZKAttendanceLogs();

  const pktNow = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const todayStr = `${pktNow.getUTCFullYear()}-${String(pktNow.getUTCMonth() + 1).padStart(2, "0")}-${String(pktNow.getUTCDate()).padStart(2, "0")}`;

  const todayLogs = logs.filter((l) => {
    if (!["IKIA1039", "1039"].includes(l.user_id)) return false;
    const ts = new Date(l.record_time);
    const pkt = new Date(ts.getTime() + 5 * 60 * 60 * 1000);
    const d = `${pkt.getUTCFullYear()}-${String(pkt.getUTCMonth() + 1).padStart(2, "0")}-${String(pkt.getUTCDate()).padStart(2, "0")}`;
    return d === todayStr;
  });

  if (!todayLogs.length) {
    return NextResponse.json({ found: false, allUserIds: [...new Set(logs.map(l => l.user_id))].slice(0, 40) });
  }

  const checkInLogs = todayLogs.filter(l => l.state !== 1);
  const pick = (checkInLogs.length ? checkInLogs : todayLogs)
    .reduce((a, b) => new Date(a.record_time) < new Date(b.record_time) ? a : b);

  const checkIn = new Date(pick.record_time);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rec = await prisma.hRMAttendance.findFirst({
    where: { employeeId: amna.id, date: { gte: today } },
  });

  if (rec) {
    await prisma.hRMAttendance.update({
      where: { id: rec.id },
      data: { checkIn, isManual: false, status: "PRESENT", lateMinutes: null },
    });
  } else {
    await prisma.hRMAttendance.create({
      data: { employeeId: amna.id, date: today, checkIn, isManual: false, status: "PRESENT" },
    });
  }

  return NextResponse.json({ ok: true, checkIn: checkIn.toISOString(), punches: todayLogs.map(l => ({ time: l.record_time, state: l.state })) });
}
