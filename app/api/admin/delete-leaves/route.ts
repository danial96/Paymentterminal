import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const results: Record<string, unknown> = {};

  // Huzaifa — search by lastName Alam + contains Huzaifa
  const huzaifa = await prisma.hRMEmployee.findFirst({
    where: { lastName: "Alam", firstName: { contains: "Huzaifa" } },
  });

  if (huzaifa) {
    const deleted = await prisma.hRMLeave.deleteMany({
      where: { employeeId: huzaifa.id },
    });
    results["Huzaifa Alam"] = `${deleted.count} leave(s) deleted`;

    // Fix attendance: ON_LEAVE → PRESENT for 23-24 Jul
    const attFixed = await prisma.hRMAttendance.updateMany({
      where: {
        employeeId: huzaifa.id,
        status: "ON_LEAVE",
        date: { gte: new Date("2026-07-23"), lte: new Date("2026-07-24T23:59:59") },
      },
      data: { status: "PRESENT" },
    });
    results["Huzaifa attendance fixed"] = `${attFixed.count} record(s) updated`;
  } else {
    results["Huzaifa Alam"] = "employee not found";
  }

  // Amna Rizwan — fix ON_LEAVE attendance to PRESENT for leave dates
  const amna = await prisma.hRMEmployee.findFirst({
    where: { firstName: "Amna", lastName: "Rizwan" },
  });

  if (amna) {
    const attFixed = await prisma.hRMAttendance.updateMany({
      where: {
        employeeId: amna.id,
        status: "ON_LEAVE",
        date: {
          gte: new Date("2026-07-25"),
          lte: new Date("2026-08-05T23:59:59"),
        },
      },
      data: { status: "PRESENT" },
    });
    results["Amna attendance fixed"] = `${attFixed.count} ON_LEAVE record(s) → PRESENT`;
  } else {
    results["Amna Rizwan"] = "employee not found";
  }

  return NextResponse.json({ ok: true, results });
}
