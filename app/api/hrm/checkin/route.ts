import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function pktNow() {
  // DB stores naive PKT datetimes; Vercel runs UTC so add 5h
  return new Date(Date.now() + 5 * 60 * 60 * 1000);
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employee = await prisma.hRMEmployee.findFirst({
    where: { userId: Number(session.user.id), deletedAt: null },
  });
  if (!employee) return NextResponse.json({ error: "No employee record" }, { status: 404 });

  const now = pktNow();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

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
