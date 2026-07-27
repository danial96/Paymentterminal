import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results: Record<string, unknown> = {};

  for (const empId of ["IKIA1023", "IKIA1026"]) {
    const employee = await prisma.hRMEmployee.findFirst({ where: { employeeId: empId } });
    if (!employee) { results[empId] = "not found"; continue; }

    const rec = await prisma.hRMAttendance.findFirst({
      where: { employeeId: employee.id, date: { gte: today } },
    });

    results[empId] = rec
      ? { checkIn: rec.checkIn, checkOut: rec.checkOut, isManual: rec.isManual, status: rec.status, lateMinutes: rec.lateMinutes }
      : "no record today";
  }

  return NextResponse.json(results);
}

export async function POST() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results: Record<string, unknown> = {};

  // IKIA1026 (Anas) — 1:59 PM PKT stored as naive PKT, biometric
  const anas = await prisma.hRMEmployee.findFirst({ where: { employeeId: "IKIA1026" } });
  if (anas) {
    const checkIn = new Date(today);
    checkIn.setHours(13, 59, 0, 0); // 1:59 PM as naive PKT datetime
    const rec = await prisma.hRMAttendance.findFirst({ where: { employeeId: anas.id, date: { gte: today } } });
    if (rec) {
      await prisma.hRMAttendance.update({
        where: { id: rec.id },
        data: { checkIn, isManual: false, status: "PRESENT", lateMinutes: null },
      });
      results["IKIA1026"] = "checkIn → 01:59 PM PKT, source → Biometric, status → PRESENT";
    } else {
      results["IKIA1026"] = "no record found";
    }
  }

  // IKIA1023 (Zain) — 3:47 PM PKT stored as naive PKT, biometric, LATE (17 min past 3:30 PM threshold)
  const zain = await prisma.hRMEmployee.findFirst({ where: { employeeId: "IKIA1023" } });
  if (zain) {
    const checkIn = new Date(today);
    checkIn.setHours(15, 47, 41, 0); // 3:47 PM as naive PKT datetime
    const rec = await prisma.hRMAttendance.findFirst({ where: { employeeId: zain.id, date: { gte: today } } });
    if (rec) {
      await prisma.hRMAttendance.update({
        where: { id: rec.id },
        data: { checkIn, isManual: false, status: "LATE", lateMinutes: 17 },
      });
      results["IKIA1023"] = "checkIn → 03:47 PM PKT, source → Biometric, status → LATE (17 min)";
    } else {
      results["IKIA1023"] = "no record found";
    }
  }

  return NextResponse.json({ ok: true, results });
}
