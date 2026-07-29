import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getZKAttendanceLogs } from "@/lib/zkteco";

export async function POST() {
  try {
  const amna = await prisma.hRMEmployee.findFirst({ where: { employeeId: "IKIA1039" } });
  if (!amna) return NextResponse.json({ error: "not found" }, { status: 404 });

  const logs = await getZKAttendanceLogs();

  // Days to check: Jul 25, 26, 28, 29, 30
  const targetDates = ["2026-07-25", "2026-07-26", "2026-07-28", "2026-07-29", "2026-07-30"];

  // Filter Amna's logs
  const amnaLogs = logs.filter(l => ["IKIA1039", "1039"].includes(l.user_id));

  const results: Record<string, unknown> = {};

  for (const dateStr of targetDates) {
    const dayLogs = amnaLogs.filter(l => {
      const ts = new Date(l.record_time);
      const d = ts.toISOString().slice(0, 10);
      return d === dateStr;
    });

    if (!dayLogs.length) {
      results[dateStr] = "no ZK punches found";
      continue;
    }

    const checkInLogs = dayLogs.filter(l => l.state !== 1);
    const checkOutLogs = dayLogs.filter(l => l.state === 1);

    const checkIn = checkInLogs.length
      ? new Date(checkInLogs.reduce((a, b) => new Date(a.record_time) < new Date(b.record_time) ? a : b).record_time)
      : null;
    const checkOut = checkOutLogs.length
      ? new Date(checkOutLogs.reduce((a, b) => new Date(a.record_time) > new Date(b.record_time) ? a : b).record_time)
      : null;

    const workingHours = checkIn && checkOut
      ? Math.round(((checkOut.getTime() - checkIn.getTime()) / 3600000) * 100) / 100
      : null;

    const date = new Date(dateStr + "T00:00:00.000Z");

    await prisma.hRMAttendance.upsert({
      where: { employeeId_date: { employeeId: amna.id, date } },
      create: { employeeId: amna.id, date, checkIn, checkOut, status: "PRESENT", workingHours, isManual: false },
      update: { checkIn, checkOut, status: "PRESENT", workingHours, isManual: false },
    });

    results[dateStr] = {
      checkIn: checkIn?.toISOString() ?? null,
      checkOut: checkOut?.toISOString() ?? null,
      workingHours,
      punches: dayLogs.map(l => ({ time: l.record_time, state: l.state })),
    };
  }

  return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
