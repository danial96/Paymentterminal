import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayWorkDate } from "@/lib/attendance-utils";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employee = await prisma.hRMEmployee.findFirst({
    where: { userId: Number(session.user.id), deletedAt: null },
  });
  if (!employee) return NextResponse.json({ error: "No employee record" }, { status: 404 });

  const now = new Date(); // actual UTC — consistent with ZK sync and portal action
  const today = todayWorkDate();

  // Late threshold: 9:15 AM PKT = 4:15 AM UTC
  const lateThreshold = new Date(today.getTime() + (4 * 60 + 15) * 60000);
  const isLate = now > lateThreshold;
  const lateMinutes = isLate ? Math.floor((now.getTime() - lateThreshold.getTime()) / 60000) : 0;

  const record = await prisma.hRMAttendance.upsert({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
    create: {
      employeeId: employee.id,
      date: today,
      checkIn: now,
      status: isLate ? "LATE" : "PRESENT",
      lateMinutes: lateMinutes > 0 ? lateMinutes : null,
      isManual: true,
    },
    update: {
      checkIn: now,
      status: isLate ? "LATE" : "PRESENT",
      lateMinutes: lateMinutes > 0 ? lateMinutes : null,
    },
  });

  return NextResponse.json({ ok: true, record });
}
