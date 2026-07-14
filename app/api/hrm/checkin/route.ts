import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employee = await prisma.hRMEmployee.findFirst({
    where: { userId: Number(session.user.id), deletedAt: null },
  });
  if (!employee) return NextResponse.json({ error: "No employee record" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  const lateThreshold = new Date(now);
  lateThreshold.setHours(9, 15, 0, 0);
  const isLate = now > lateThreshold;

  const record = await prisma.hRMAttendance.upsert({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
    create: {
      employeeId: employee.id,
      date: today,
      checkIn: now,
      status: isLate ? "LATE" : "PRESENT",
    },
    update: {
      checkIn: now,
      status: isLate ? "LATE" : "PRESENT",
    },
  });

  return NextResponse.json({ ok: true, record });
}
