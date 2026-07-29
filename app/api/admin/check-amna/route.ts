import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const amna = await prisma.hRMEmployee.findFirst({ where: { employeeId: "IKIA1039" } });
  if (!amna) return NextResponse.json({ error: "not found" });

  const records = await prisma.hRMAttendance.findMany({
    where: { employeeId: amna.id },
    orderBy: { date: "desc" },
    take: 10,
  });

  return NextResponse.json(records.map(r => ({
    id: r.id,
    date: r.date,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    status: r.status,
    isManual: r.isManual,
    notes: r.notes,
  })));
}
