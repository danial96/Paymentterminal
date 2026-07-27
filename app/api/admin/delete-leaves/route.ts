import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // Amna Rizwan — delete all her test leaves
  const amna = await prisma.hRMEmployee.findFirst({
    where: { firstName: "Amna", lastName: "Rizwan" },
  });

  // Muhammad Huzaifa Alam — delete unpaid leave 23-24 Jul
  const huzaifa = await prisma.hRMEmployee.findFirst({
    where: { firstName: "Muhammad Huzaifa", lastName: "Alam" },
  });

  const results: Record<string, unknown> = {};

  if (amna) {
    const deleted = await prisma.hRMLeave.deleteMany({
      where: { employeeId: amna.id },
    });
    results["Amna Rizwan"] = `${deleted.count} leaves deleted`;
  } else {
    results["Amna Rizwan"] = "employee not found";
  }

  if (huzaifa) {
    const deleted = await prisma.hRMLeave.deleteMany({
      where: {
        employeeId: huzaifa.id,
        startDate: new Date("2026-07-23"),
        endDate: new Date("2026-07-24"),
      },
    });
    results["Muhammad Huzaifa Alam"] = `${deleted.count} leave deleted`;
  } else {
    results["Muhammad Huzaifa Alam"] = "employee not found";
  }

  return NextResponse.json({ ok: true, results });
}
