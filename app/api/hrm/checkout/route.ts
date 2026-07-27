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

  const existing = await prisma.hRMAttendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });
  if (!existing || !existing.checkIn) {
    return NextResponse.json({ error: "Not checked in" }, { status: 400 });
  }

  const totalMins = (now.getTime() - existing.checkIn.getTime()) / 60000;
  const workingHours = Math.max(0, totalMins / 60);
  const overtime = Math.max(0, workingHours - 8);

  const record = await prisma.hRMAttendance.update({
    where: { id: existing.id },
    data: { checkOut: now, workingHours, overtimeHours: overtime },
  });

  return NextResponse.json({ ok: true, record });
}
