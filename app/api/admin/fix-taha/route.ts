import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/scope";

export async function POST() {
  await requireUser();

  const rec = await prisma.hRMAttendance.findFirst({
    where: {
      employee: { employeeId: "IKIA1025" },
      date: { gte: new Date("2026-07-24T00:00:00"), lte: new Date("2026-07-24T23:59:59") },
    },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });

  if (!rec || !rec.checkOut || !rec.checkIn) {
    return NextResponse.json({ error: "Record not found or missing checkOut" }, { status: 404 });
  }

  // Was stored as UTC (18:26), correct PKT = +5h → 23:26
  const fixedCheckOut = new Date(new Date(rec.checkOut).getTime() + 5 * 60 * 60 * 1000);
  const workingHours  = Math.max(0, (fixedCheckOut.getTime() - new Date(rec.checkIn).getTime()) / 3600000);
  const overtimeHours = Math.max(0, workingHours - 8);

  await prisma.hRMAttendance.update({
    where: { id: rec.id },
    data: { checkOut: fixedCheckOut, workingHours, overtimeHours },
  });

  return NextResponse.json({
    ok: true,
    employee: `${rec.employee.firstName} ${rec.employee.lastName}`,
    fixedCheckOut: fixedCheckOut.toISOString(),
    workingHours: workingHours.toFixed(2),
  });
}
