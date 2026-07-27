import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const emp = await prisma.hRMEmployee.findFirst({ where: { employeeId: "IKIA1021" } });
  if (!emp) return NextResponse.json({ error: "not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updated = await prisma.hRMAttendance.updateMany({
    where: { employeeId: emp.id, date: { gte: today } },
    data: { isManual: false },
  });

  return NextResponse.json({ ok: true, updated: updated.count });
}
