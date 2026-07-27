import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2:29 PM PKT stored as naive PKT datetime
  const checkInTime = new Date(today);
  checkInTime.setHours(14, 29, 0, 0);

  const results: Record<string, unknown> = {};

  for (const empId of ["IKIA1028", "IKIA1021"]) {
    const employee = await prisma.hRMEmployee.findFirst({
      where: { employeeId: empId },
    });
    if (!employee) { results[empId] = "not found"; continue; }

    const rec = await prisma.hRMAttendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: today, lt: new Date(today.getTime() + 86400000) },
      },
    });

    if (rec) {
      await prisma.hRMAttendance.update({
        where: { id: rec.id },
        data: { checkIn: checkInTime, status: "PRESENT", lateMinutes: null },
      });
      results[empId] = `updated → 02:29 PM`;
    } else {
      await prisma.hRMAttendance.create({
        data: {
          employeeId: employee.id,
          date: today,
          checkIn: checkInTime,
          status: "PRESENT",
          isManual: true,
        },
      });
      results[empId] = `created → 02:29 PM`;
    }
  }

  return NextResponse.json({ ok: true, results });
}
